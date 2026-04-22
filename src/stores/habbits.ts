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

	const userHabbitsList = ref<UserHabbits[]>([]); // This will hold the user's selected habbits for each day
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

			// Kiedy zmieniamy kolejność na ekranie, przechodzimy przez nową listę
			newGroupedArray.forEach((group: any) => {
				// Szukamy w oryginalnej liście wszystkich wykonań danego nawyku
				const originalItems = selectedDayHabbits.value.filter(
					(h: any) => h.name === group.name,
				);
				// Wrzucamy je do nowej tablicy (dzięki temu np. 3 szklanki wody będą teraz obok siebie w nowym miejscu)
				newRawArray.push(...originalItems);
			});

			// Zapisujemy nową ułożoną listę do głównej zmiennej, która wyśle to do Firestore
			selectedDayHabbits.value = newRawArray;
		},
	});

	// Goals refs
	const dailyGoalsList = ref<Goal[]>([]);
	const dailyGoalsColored = computed<Goal[]>(() => {
		const formatedGoals = [];
		const counters: Record<string, number> = {};

		for (const goal of dailyGoalsList.value) {
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

			// Obliczamy pierwszy i ostatni dzień dla nowo wybranego miesiąca
			const newStartDate = new Date(
				Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1),
			);
			// 0 jako dzień miesiąca oznacza ostatni dzień poprzedniego miesiąca
			const newEndDate = new Date(
				Date.UTC(
					selectedDate.getUTCFullYear(),
					selectedDate.getUTCMonth() + 1,
					0,
				),
			);

			// Pobieramy dane dla całego miesiąca
			await getDailyHabbitsInRange(newStartDate, newEndDate);

			// Rozszerzamy nasz załadowany zakres, aby nie pobierać tego ponownie
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
			// Jeśli nie podano daty, ładujemy zakres domyślny (czyli obecny miesiąc)
			const _startDate = startDate || loadedStartDate.value;
			const _endDate = endDate || loadedEndDate.value;

			const habbitsRef = collection(db, "users", userUid.value!!, "habbits");
			const q = query(
				habbitsRef,
				where("date", ">=", toDateKey(_startDate)),
				where("date", "<=", toDateKey(_endDate)),
			);
			const querySnapshot = await getDocs(q);

			querySnapshot.forEach((doc) => {
				const { date, habbits } = doc.data();

				const alreadyExists = userHabbitsList.value.some(
					(entry) => entry.date === date,
				);

				if (!alreadyExists) {
					userHabbitsList.value.push({ date, habbits });
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

	// Sprawdza czy w danym dniu jest dodana jakakolwiek aktywność
	function hasHabbitsOnDate(dateObj: any) {
		if (!dateObj) return false;

		// Używamy Date.UTC, aby uniknąć problemów ze strefą czasową!
		const dateToCheck = new Date(
			Date.UTC(dateObj.year, dateObj.month, dateObj.day),
		);

		// Tworzymy klucz daty (np. "2023-10-15") i szukamy go w liście
		const key = toDateKey(dateToCheck);
		const entry = userHabbitsList.value.find((item) => item.date === key);

		// Jeśli znaleźliśmy wpis i ma on jakieś zadania, zwracamy true
		return entry ? entry.habbits.length > 0 : false;
	}

	function setDate(date: Date) {
		refDate.value = new Date(date);
	}

	// Habbit functions
	async function loadHabbitsFromFile() {
		const response = await fetch("/src/assets/habbitList.json");
		const data = await response.json();
		allHabbitsList.value = data;
	}

	async function loadTagCategories() {
		const response = await fetch("/src/assets/tagList.json");
		const data = await response.json();
		tag_categories.value = data;
	}

	async function addHabbitToSelectedDay(habbit: Habbit) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userHabbitsList.value.find(
					(day) => day.date === formattedDate,
				);
				const habbitWithId = { ...habbit, id: nanoid() };

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
						});
						dayEntry.habbits.push(habbitWithId);
					} else {
						await setDoc(habbitsRef, {
							date: formattedDate,
							habbits: [habbitWithId],
						});
						userHabbitsList.value.push({
							date: formattedDate,
							habbits: [habbitWithId],
						});
					}
					addToRecentHabbits(habbit.name);
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
							});
							dayEntry.habbits.splice(index, 1);
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

	async function addDailyGoal(goal: Goal) {
		await handleAsyncAction(
			async () => {
				try {
					const newGoal = { ...goal, id: nanoid(), severity: goal.severity };
					const updatedList = [...dailyGoalsList.value, newGoal];

					const userDocRef = doc(db, "users", userUid.value!!);

					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;
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
					const updatedList = dailyGoalsList.value.filter(
						(g) => g.id !== goal.id,
					);

					const userDocRef = doc(db, "users", userUid.value!!);
					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;
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
		// It means that habbits is completed and we should remove habbit from current habbits
		if (goal.severity !== "empty") {
			deleteHabbitFromSelectedDay(goal);
		}
		// And that means it's not so we should add it to the list
		else {
			// change severity to original
			const goalFormatted = dailyGoalsList.value.find(
				(g) => g.name === goal.name,
			);
			if (!goalFormatted) {
				console.error("Goal not found:", goal.name);
				return;
			}
			addHabbitToSelectedDay(goalFormatted);
		}
	}

	//Update habbits after drag and drop
	// This function updates the order of habbits in Firestore after drag and drop
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

	//Update goals after drag and drop
	// This function updates the order of daily goals in Firestore after drag and drop
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
		const sameGoals = dailyGoalsList.value.filter((g) => g.name === goal.name);
		const indexInSameGoals = sameGoals.findIndex((g) => g.id === goal.id);
		if (indexInSameGoals !== -1 && indexInSameGoals < matchingHabbits.length) {
			return goal.severity;
		}
		return "empty";
	}

	// Helper function to get the index of a goal instance in the list
	// It checks the name and id of the goal to find its index
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

	// Recent habbits functions

	function addToRecentHabbits(habbitName: string) {
		const index = recentHabbits.value.indexOf(habbitName);

		if (index !== -1) {
			recentHabbits.value.splice(index, 1); // move to front
		}
		recentHabbits.value.unshift(habbitName); // add to front

		// Hard limit to 10
		recentHabbits.value = recentHabbits.value.slice(0, 10);

		saveRecentHabbits(recentHabbits.value);
	}

	// This function saves the recent habbits to the user's document in Firestore
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

	// This function loads the recent habbits from the user's document in Firestore
	// It will be called when the store is initialized
	// and when the user logs in
	// It will also be called when the user updates their recent habbits
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
	// Funkcja wywoływana tylko wtedy, gdy użytkownik zmienia miesiąc w kalendarzu
	async function loadHabbitsForMonth(year: number, month: number) {
		// PrimeVue zwraca miesiące od 1 (Styczeń) do 12 (Grudzień)
		// JavaScript liczy miesiące od 0 do 11, dlatego odejmujemy 1
		const jsMonth = month - 1;

		const newStartDate = new Date(Date.UTC(year, jsMonth, 1));
		const newEndDate = new Date(Date.UTC(year, jsMonth + 1, 0));

		// Pobieramy dane za ten miesiąc w tle
		await getDailyHabbitsInRange(newStartDate, newEndDate);
	}

	loadHabbitsFromFile();
	loadTagCategories();
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
	};
});
