import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { formatDate, toDateKey } from "@/utils/timeUtils";
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
	setDoc,
	getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Goal, UserHabbits, Habbit } from "@/libs/types";
import { nanoid } from "nanoid";
import { useAuthStore } from "./auth";
import { handleAsyncAction } from "@/stores/asyncActionHandler";
import habbitListData from "@/assets/habbitList.json";
import tagListData from "@/assets/tagList.json";

export const useHabbitsStore = defineStore("habbits", () => {
	const authStore = useAuthStore();
	const { userUid } = storeToRefs(authStore);

	// Date refs
	const refDate = ref(new Date());
	const dateFormated = computed(() => formatDate(refDate.value));

	const allHabbitsList = ref<Habbit[]>([]); // This will hold all available habbits
	const tag_categories = ref<Record<string, string[]>>({});

	const specialFilters = [
		{ name: "recently", display_name: "Recently", icon: "pi pi-clock" },
		{ name: "all", display_name: "All", icon: "pi pi-list" },
		{ name: "user", display_name: "User", icon: "pi pi-user" },
	];

	const recentHabbits = ref<string[]>([]); // This will hold the recently used habbits

	const userHabbitsList = ref<any[]>([]); // Holds user's selected habbits and goals snapshots

	const selectedDayHabbits = computed({
		get() {
			const key = toDateKey(refDate.value);
			const entry = userHabbitsList.value.find((item) => item.date === key);
			return entry ? entry.habbits : [];
		},
		set(newHabbits) {
			const key = toDateKey(refDate.value);
			const index = userHabbitsList.value.findIndex(
				(item) => item.date === key,
			);
			if (index !== -1) {
				userHabbitsList.value[index].habbits = newHabbits;
			} else {
				userHabbitsList.value.push({
					date: key,
					habbits: newHabbits,
				});
			}
		},
	});

	const groupedSelectedDayHabbits = computed({
		get() {
			const grouped: Record<string, any> = {};
			selectedDayHabbits.value.forEach((habbit: any) => {
				if (!grouped[habbit.name]) {
					grouped[habbit.name] = { ...habbit, count: 1 };
				} else {
					grouped[habbit.name].count += 1;
				}
			});
			return Object.values(grouped);
		},
		set(newGroupedArray) {
			const newRawArray: any[] = [];

			newGroupedArray.forEach((group: any) => {
				const originalItems = selectedDayHabbits.value.filter(
					(h: any) => h.name === group.name,
				);
				newRawArray.push(...originalItems);
			});

			selectedDayHabbits.value = newRawArray;
		},
	});

	// Goals refs
	const dailyGoalsList = ref<Goal[]>([]);

	// Pomocnicza funkcja do ustalenia, jaka lista celów obowiązuje dla danej daty
	function getGoalsSnapshotForDate(dateKey: string) {
		const dayEntry = userHabbitsList.value.find((d) => d.date === dateKey);
		const isTargetToday = dateKey === toDateKey(new Date());

		// Jeśli to dzisiaj, zawsze używamy aktualnej, globalnej listy celów
		if (isTargetToday) {
			return dailyGoalsList.value;
		}
		// Jeśli to przeszłość i ma zapisaną migawkę celów, używamy jej
		if (dayEntry && dayEntry.goalsSnapshot) {
			return dayEntry.goalsSnapshot;
		}
		// W przeciwnym wypadku (stary dzień bez migawki) zwracamy obecną listę celów
		return dailyGoalsList.value;
	}

	const dailyGoalsColored = computed<Goal[]>(() => {
		const formatedGoals = [];
		const counters: Record<string, number> = {};

		const key = toDateKey(refDate.value);
		const activeGoalsList = getGoalsSnapshotForDate(key);

		for (const goal of activeGoalsList) {
			const currentDayTaskCount = selectedDayHabbits.value.filter(
				(g) => g.name === goal.name,
			).length;

			if (!counters.hasOwnProperty(goal.name)) {
				counters[goal.name] = 1;
			} else {
				counters[goal.name] = counters[goal.name] + 1;
			}

			if (counters[goal.name] <= currentDayTaskCount) {
				formatedGoals.push({
					...goal,
					severity: goal.severity,
				});
			} else {
				formatedGoals.push({
					...goal,
					severity: "empty",
				});
			}
		}
		return formatedGoals;
	});

	// INTELIGENTNY STREAK: Liczy ile dni z rzędu wszystkie cele zostały wykonane
	const goalsStreak = computed(() => {
		let streak = 0;
		const checkDate = new Date();
		checkDate.setUTCHours(0, 0, 0, 0);

		while (true) {
			const key = toDateKey(checkDate);
			const entry = userHabbitsList.value.find((item) => item.date === key);
			const todayKey = toDateKey(new Date());

			// Jeśli brak wpisu dla danego dnia
			if (!entry) {
				// Jeśli to dzisiaj i nie jest jeszcze skończony, nie psujemy serii z poprzednich dni
				if (key === todayKey) {
					checkDate.setUTCDate(checkDate.getUTCDate() - 1);
					continue;
				}
				break; // Przełamana seria
			}

			const snapshot =
				entry.goalsSnapshot || (key === todayKey ? dailyGoalsList.value : []);
			if (snapshot.length === 0) {
				if (key === todayKey) {
					checkDate.setUTCDate(checkDate.getUTCDate() - 1);
					continue;
				}
				break;
			}

			// Sprawdzamy czy wszystkie cele z migawki tego dnia zostały zrealizowane
			const counters: Record<string, number> = {};
			let allMet = true;

			for (const goal of snapshot) {
				const count = entry.habbits.filter(
					(h: any) => h.name === goal.name,
				).length;
				if (!counters.hasOwnProperty(goal.name)) counters[goal.name] = 1;
				else counters[goal.name]++;

				if (counters[goal.name] > count) {
					allMet = false;
					break;
				}
			}

			if (allMet) {
				streak++;
				checkDate.setUTCDate(checkDate.getUTCDate() - 1);
			} else {
				// Jeśli to dzisiaj i cele nie są jeszcze gotowe, pomijamy i sprawdzamy wczoraj (nie psujemy serii)
				if (key === todayKey) {
					checkDate.setUTCDate(checkDate.getUTCDate() - 1);
					continue;
				}
				break; // Przeszły dzień nieukończony -> koniec serii
			}
		}
		return streak;
	});

	const now = new Date();
	const loadedStartDate = ref(
		new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
	);
	const loadedEndDate = ref(
		new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
	);

	async function loadHabbitsForDate(selectedDate: Date) {
		if (
			selectedDate < loadedStartDate.value ||
			selectedDate > loadedEndDate.value
		) {
			console.log("Ładuję nowy miesiąc do kalendarza");

			const newStartDate = new Date(
				Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1),
			);
			const newEndDate = new Date(
				Date.UTC(
					selectedDate.getUTCFullYear(),
					selectedDate.getUTCMonth() + 1,
					0,
				),
			);

			await getDailyHabbitsInRange(newStartDate, newEndDate);

			loadedStartDate.value =
				newStartDate < loadedStartDate.value
					? newStartDate
					: loadedStartDate.value;
			loadedEndDate.value =
				newEndDate > loadedEndDate.value ? newEndDate : loadedEndDate.value;
		}
	}

	const getDailyHabbitsInRange = async (
		startDate: Date | null = null,
		endDate: Date | null = null,
	) => {
		try {
			const _startDate = startDate || loadedStartDate.value;
			const _endDate = endDate || loadedEndDate.value;

			const habbitsRef = collection(db, "users", userUid.value!!, "habbits");
			const q = query(
				habbitsRef, // Naprawiono literówkę z hbitsRef
				where("date", ">=", toDateKey(_startDate)),
				where("date", "<=", toDateKey(_endDate)),
			);
			const querySnapshot = await getDocs(q);

			querySnapshot.forEach((doc) => {
				const { date, habbits, goalsSnapshot } = doc.data();

				const alreadyExists = userHabbitsList.value.some(
					(entry) => entry.date === date,
				);

				if (!alreadyExists) {
					userHabbitsList.value.push({ date, habbits, goalsSnapshot });
				}
			});
		} catch (error) {
			console.error("Error fetching daily habbits:", error);
		}
	};

	// Date functions
	function changeDate(direction: number) {
		refDate.value.setUTCDate(refDate.value.getUTCDate() + direction);
		refDate.value.setUTCHours(0, 0, 0, 0);
		refDate.value = new Date(refDate.value);
	}

	function isToday() {
		const today = new Date();
		return (
			refDate.value.getDate() === today.getDate() &&
			refDate.value.getMonth() === today.getMonth() &&
			refDate.value.getFullYear() === today.getFullYear()
		);
	}

	function hasHabbitsOnDate(dateObj: any) {
		if (!dateObj) return false;

		const dateToCheck = new Date(
			Date.UTC(dateObj.year, dateObj.month, dateObj.day),
		);

		const key = toDateKey(dateToCheck);
		const entry = userHabbitsList.value.find((item) => item.date === key);

		return entry ? entry.habbits.length > 0 : false;
	}

	function setDate(date: Date) {
		refDate.value = new Date(date);
	}

	// Habbit functions
	async function loadHabbitsFromFile() {
		allHabbitsList.value = habbitListData as Habbit[];
	}

	async function loadTagCategories() {
		tag_categories.value = tagListData as Record<string, string[]>;
	}

	async function addHabbitToSelectedDay(habbit: Habbit) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userHabbitsList.value.find(
					(day) => day.date === formattedDate,
				);
				const habbitWithId = { ...habbit, id: nanoid() };

				// Ustalamy poprawną migawkę celów do zachowania na ten dzień
				const snapshotToSave =
					formattedDate === toDateKey(new Date())
						? dailyGoalsList.value
						: dayEntry && dayEntry.goalsSnapshot
							? dayEntry.goalsSnapshot
							: dailyGoalsList.value;

				try {
					const habbitsRef = doc(
						db,
						"users",
						userUid.value!!,
						"habbits",
						formattedDate,
					);

					if (dayEntry) {
						await updateDoc(habbitsRef, {
							habbits: [...dayEntry.habbits, habbitWithId],
							goalsSnapshot: snapshotToSave,
						});
						dayEntry.habbits.push(habbitWithId);
						dayEntry.goalsSnapshot = [...snapshotToSave];
					} else {
						await setDoc(habbitsRef, {
							date: formattedDate,
							habbits: [habbitWithId],
							goalsSnapshot: snapshotToSave,
						});
						userHabbitsList.value.push({
							date: formattedDate,
							habbits: [habbitWithId],
							goalsSnapshot: [...snapshotToSave],
						});
					}

					addToRecentHabbits(habbit.name);

					// !!! TO JEST NASZ KLUCZOWY DODATEK !!!
					if (authStore.isGuest) {
						authStore.showGuestNotification = true;
					}
				} catch (error) {
					console.error("Error adding habbit to Firestore:", error);
				}
			},
			"Habbit added!",
			"Failed to add habbit.",
		);
	}

	async function deleteHabbitFromSelectedDay(habbit: Habbit) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userHabbitsList.value.find(
					(day) => day.date === formattedDate,
				);

				if (dayEntry) {
					const index = dayEntry.habbits.findIndex(
						(t) => t.name === habbit.name,
					);
					const updatedHabbits = [...dayEntry.habbits];
					updatedHabbits.splice(index, 1);

					if (index !== -1) {
						// Zachowujemy obecną migawkę celów dnia podczas usuwania nawyku
						const snapshotToSave =
							formattedDate === toDateKey(new Date())
								? dailyGoalsList.value
								: dayEntry.goalsSnapshot
									? dayEntry.goalsSnapshot
									: dailyGoalsList.value;

						try {
							const habbitsRef = doc(
								db,
								"users",
								userUid.value!!,
								"habbits",
								formattedDate,
							);
							await updateDoc(habbitsRef, {
								habbits: updatedHabbits,
								goalsSnapshot: snapshotToSave,
							});
							dayEntry.habbits.splice(index, 1);
							dayEntry.goalsSnapshot = [...snapshotToSave];
						} catch (error) {
							console.error("Error removing habbit from Firestore:", error);
						}
					}
				}
			},
			"Habbit deleted!",
			"Failed to deleted habbit.",
		);
	}

	// Goals functions
	async function loadDailyGoals() {
		try {
			const userDocRef = doc(db, "users", userUid.value!!);
			const userDoc = await getDoc(userDocRef);

			if (userDoc.exists() && userDoc.data().dailyGoals) {
				dailyGoalsList.value = userDoc.data().dailyGoals;
			} else {
				setDoc(userDocRef, { dailyGoals: [] }, { merge: true });
				console.log("No dailyGoals found for the user. Creating empty entry");
			}
		} catch (error) {
			console.error("Error loading dailyGoals from Firestore:", error);
		}
	}

	// Pomocnicza funkcja: aktualizuje migawkę dla AKTUALNIE PRZEGLĄDANEGO dnia
	async function syncSelectedDaySnapshot(updatedList: Goal[]) {
		const currentKey = toDateKey(refDate.value); // Zmiana z new Date() na refDate.value!
		const dayEntry = userHabbitsList.value.find(
			(day) => day.date === currentKey,
		);

		if (dayEntry) {
			dayEntry.goalsSnapshot = updatedList;
			try {
				const habbitsRef = doc(
					db,
					"users",
					userUid.value!!,
					"habbits",
					currentKey,
				);
				await updateDoc(habbitsRef, { goalsSnapshot: updatedList });
				console.log(
					`Zsynchronizowano migawkę celów dla wyświetlanego dnia: ${currentKey}`,
				);
			} catch (error) {
				console.error("Error updating selected day's snapshot:", error);
			}
		}
	}

	// Pomocnicza funkcja: ZAWSZE synchronizuje tylko dzisiejszy dzień (bo przeszłości nie edytujemy)
	async function syncTodaySnapshot(updatedList: Goal[]) {
		const todayKey = toDateKey(new Date());
		const dayEntry = userHabbitsList.value.find((day) => day.date === todayKey);

		if (dayEntry) {
			dayEntry.goalsSnapshot = updatedList;
			try {
				const habbitsRef = doc(
					db,
					"users",
					userUid.value!!,
					"habbits",
					todayKey,
				);
				await updateDoc(habbitsRef, { goalsSnapshot: updatedList });
			} catch (error) {
				console.error("Error updating today's snapshot:", error);
			}
		}
	}

	async function addDailyGoal(goal: Goal) {
		await handleAsyncAction(
			async () => {
				try {
					const newGoal = { ...goal, id: nanoid(), severity: goal.severity };

					// Dodajemy do głównej bazy (globalnie)
					const updatedList = [...dailyGoalsList.value, newGoal];
					const userDocRef = doc(db, "users", userUid.value!!);
					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;

					// Synchronizujemy z dzisiejszą migawką
					await syncTodaySnapshot(updatedList);
					console.log("Daily goal added successfully.");
				} catch (error) {
					console.error("Error adding daily goal to Firestore:", error);
				}
			},
			"Goal added!",
			"Failed to add goal.",
		);
	}

	async function deleteDailyGoal(goal: Goal) {
		await handleAsyncAction(
			async () => {
				try {
					// Usuwamy z głównej bazy (globalnie)
					const updatedList = dailyGoalsList.value.filter(
						(g) => g.id !== goal.id,
					);
					const userDocRef = doc(db, "users", userUid.value!!);
					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;

					// Synchronizujemy z dzisiejszą migawką
					await syncTodaySnapshot(updatedList);
					console.log("Daily goal deleted successfully.");
				} catch (error) {
					console.error("Error deleting daily goal from Firestore:", error);
				}
			},
			"Goal deleted!",
			"Failed to deleted goal.",
		);
	}

	function onGoalClick(goal: Goal) {
		if (goal.severity !== "empty") {
			deleteHabbitFromSelectedDay(goal);
		} else {
			const activeSnapshot = getGoalsSnapshotForDate(toDateKey(refDate.value));
			const goalFormatted = activeSnapshot.find((g) => g.name === goal.name);
			if (!goalFormatted) {
				console.error("Goal not found in active snapshot:", goal.name);
				return;
			}
			addHabbitToSelectedDay(goalFormatted);
		}
	}

	async function updateHabbitsOrderInFirestore() {
		const formattedDate = toDateKey(refDate.value);
		const entryIndex = userHabbitsList.value.findIndex(
			(day) => day.date === formattedDate,
		);
		if (entryIndex === -1) return;

		const habbitsRef = doc(
			db,
			"users",
			userUid.value!!,
			"habbits",
			formattedDate,
		);
		try {
			await updateDoc(habbitsRef, {
				habbits: userHabbitsList.value[entryIndex].habbits,
			});
			console.log("Habbits order updated in Firestore.");
		} catch (error) {
			console.error("Error updating habbits order in Firestore:", error);
		}
	}

	async function updateGoalsOrderInFirestore() {
		try {
			const userDocRef = doc(db, "users", userUid.value!!);
			await updateDoc(userDocRef, {
				dailyGoals: dailyGoalsList.value,
			});
			console.log("Daily goals order updated in Firestore.");
		} catch (error) {
			console.error("Error updating daily goals order:", error);
		}
	}

	function getGoalSeverity(goal: Goal) {
		const habbitsForToday = selectedDayHabbits.value;
		const matchingHabbits = habbitsForToday.filter((h) => h.name === goal.name);
		const activeSnapshot = getGoalsSnapshotForDate(toDateKey(refDate.value));
		const sameGoals = activeSnapshot.filter((g) => g.name === goal.name);
		const indexInSameGoals = sameGoals.findIndex((g) => g.id === goal.id);
		if (indexInSameGoals !== -1 && indexInSameGoals < matchingHabbits.length) {
			return goal.severity;
		}
		return "empty";
	}

	function getGoalInstanceIndex(goal: Goal, list: Goal[]) {
		let count = 0;
		for (let i = 0; i < list.length; i++) {
			if (list[i].name === goal.name) {
				if (list[i].id === goal.id) {
					return count;
				}
				count++;
			}
		}
		return -1;
	}

	function addToRecentHabbits(habbitName: string) {
		const index = recentHabbits.value.indexOf(habbitName);

		if (index !== -1) {
			recentHabbits.value.splice(index, 1);
		}
		recentHabbits.value.unshift(habbitName);
		recentHabbits.value = recentHabbits.value.slice(0, 10);

		saveRecentHabbits(recentHabbits.value);
	}

	async function saveRecentHabbits(recentHabbits: string[]) {
		try {
			const userDocRef = doc(db, "users", userUid.value!!);
			await updateDoc(userDocRef, {
				recentlyUsed: recentHabbits,
			});
			console.log("recentHabbits saved to Firestore.");
		} catch (error) {
			console.error("Error saving recentHabbits to Firestore:", error);
		}
	}

	async function loadRecentHabbits() {
		const userDocRef = doc(db, "users", userUid.value!!);
		const docSnap = await getDoc(userDocRef);

		if (docSnap.exists()) {
			const data = docSnap.data();
			if (data.recentlyUsed && Array.isArray(data.recentlyUsed)) {
				recentHabbits.value = data.recentlyUsed;
				console.log("recentHabbits loaded from Firestore.");
			}
		}
	}

	async function loadHabbitsForMonth(year: number, month: number) {
		const jsMonth = month - 1;
		const newStartDate = new Date(Date.UTC(year, jsMonth, 1));
		const newEndDate = new Date(Date.UTC(year, jsMonth + 1, 0));

		await getDailyHabbitsInRange(newStartDate, newEndDate);
	}

	loadHabbitsFromFile();
	loadTagCategories();

	function clearData() {
		userHabbitsList.value = [];
		dailyGoalsList.value = [];
		recentHabbits.value = [];
		refDate.value = new Date(); // Resetujemy datę kalendarza do "dzisiaj"
	}

	return {
		refDate,
		dateFormated,
		changeDate,
		allHabbitsList,
		userHabbitsList,
		isToday,
		setDate,
		selectedDayHabbits,
		groupedSelectedDayHabbits,
		addHabbitToSelectedDay,
		toDateKey,
		deleteHabbitFromSelectedDay,
		dailyGoalsList,
		addDailyGoal,
		deleteDailyGoal,
		dailyGoalsColored,
		onGoalClick,
		getDailyHabbitsInRange,
		loadHabbitsForDate,
		updateHabbitsOrderInFirestore,
		updateGoalsOrderInFirestore,
		getGoalSeverity,
		getGoalInstanceIndex,
		loadDailyGoals,
		tag_categories,
		recentHabbits,
		addToRecentHabbits,
		loadRecentHabbits,
		specialFilters,
		loadHabbitsFromFile,
		hasHabbitsOnDate,
		loadHabbitsForMonth,
		goalsStreak, // Wyeksportowany w pełni sprawny streak celów!
		clearData,
	};
});
