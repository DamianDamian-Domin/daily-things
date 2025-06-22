import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { formatDate, toDateKey, convertDateToDbFormat, formatDateToDbFormat } from '@/utils/timeUtils'
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export const useHabbitsStore = defineStore("habbits", () => {

	// Date refs
	const refDate = ref(new Date());
	const dateFormated = computed(() => formatDate(refDate.value));

	// Habbit refs
	const allHabbitsList = ref([
		{
			name: "gym",
			icon: "fitness_center",
			severity: "success",
		},
		{
			name: "cook",
			icon: "skillet",
			severity: "success",
		},
		{
			name: "washing",
			icon: "local_laundry_service",
			severity: "success",
		},
		{
			name: "vacuum",
			icon: "vacuum",
			severity: "success",
		},
		{
			name: "mop",
			icon: "mop",
			severity: "success",
		},
		{
			name: "dishwasher",
			icon: "dishwasher",
			severity: "success",
		},
		{
			name: "Meet",
			icon: "groups",
			severity: "success",
		},
		{
			name: "Learn",
			icon: "school",
			severity: "success",
		},
		{
			name: "shop",
			icon: "shopping_cart",
			severity: "success",
		},
		{
			name: "bike",
			icon: "pedal_bike",
			severity: "success",
		},
		{
			name: "refuel the car",
			icon: "local_gas_station",
			severity: "success",
		},
		{
			name: "wash the car",
			icon: "local_car_wash",
			severity: "success",
		},
		{
			name: "Car repair",
			icon: "car_repair",
			severity: "success",
		},
		{
			name: "Self Care",
			icon: "self_care",
			severity: "success",
		},
		{
			name: "Dentist",
			icon: "dentistry",
			severity: "success",
		},
		{
			name: "Gynecology",
			icon: "gynecology",
			severity: "success",
		},
		{
			name: "Stadia Controller",
			icon: "stadia_controller",
			severity: "success",
		},
	]);
	const userHabbitsList = ref([]); // This will hold the user's selected habbits for each day

	const selectedDayHabbits = computed(() => {
		const key = toDateKey(refDate.value);
		const entry = userHabbitsList.value.find((item) => item.date === key);
		return entry ? entry.habbits : [];
	});

	// Goals refs
	const dailyGoalsList = ref([]);
	const dailyGoalsColored = computed(() => {

		const formatedGoals = []
		const counters = {}

		for (const goal of dailyGoalsList.value) {

			const currentDayTaskCount = selectedDayHabbits.value.filter(g => g.name === goal.name).length

			if (!counters.hasOwnProperty(goal.name)) {
				counters[goal.name] = 1
			}
			else {
				counters[goal.name] = counters[goal.name] + 1
			}

			if (counters[goal.name] <= currentDayTaskCount) {
				formatedGoals.push({
					...goal,
					severity: goal.severity
				})
			}
			else {
				formatedGoals.push({
					...goal,
					severity: 'empty'
				})
			}

		}
		return formatedGoals

	})

	const loadedStartDate = ref(new Date(new Date().setDate(new Date().getDate() - 7)));
	const loadedEndDate = ref(new Date()); // today
	async function loadHabbitsForDate(selectedDate) {
		if (selectedDate < loadedStartDate.value || selectedDate > loadedEndDate.value) {
			console.log('Laduje nowy zakres dat')

			const newStartDate = new Date(selectedDate);
			newStartDate.setDate(newStartDate.getDate() - 7);
			const newEndDate = new Date(selectedDate);
			newEndDate.setDate(newEndDate.getDate() + 7);

			// Fetch data for the new range
			await getDailyHabbitsInRange(newStartDate, newEndDate);

			// Update the loaded range
			loadedStartDate.value = newStartDate < loadedStartDate.value ? newStartDate : loadedStartDate.value;
			loadedEndDate.value = newEndDate > loadedEndDate.value ? newEndDate : loadedEndDate.value;
		}
	}

	const getDailyHabbitsInRange = async (startDate = null, endDate = null) => {
		try {
			const _startDate = startDate || new Date(new Date().setDate(new Date().getDate() - 7));
			const _endDate = endDate || new Date();

			const habbitsRef = collection(db, "users", "user1", "habbits");
			const q = query(
				habbitsRef,
				where("date", ">=", formatDateToDbFormat(_startDate)),
				where("date", "<=", formatDateToDbFormat(_endDate))
			);
			const querySnapshot = await getDocs(q);

			querySnapshot.forEach((doc) => {
				const { date, habbits } = doc.data();

				const alreadyExists = userHabbitsList.value.some((entry) => entry.date === date);

				if (!alreadyExists) {
					userHabbitsList.value.push({ date, habbits });
				}
			});
		} catch (error) {
			console.error("Error fetching daily habbits:", error);
		}
	};


	// Date functions
	function changeDate(direction) {
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
	function setDate(date) {
		refDate.value = new Date(date);
	}

	// Habbit functions
	async function addHabbitToSelectedDay(habbit) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userHabbitsList.value.find(
			(day) => day.date === formattedDate
		);

		try {
			const habbitsRef = doc(db, "users", "user1", "habbits", formattedDate);

			if (dayEntry) {
				await updateDoc(habbitsRef, {
					habbits: [...dayEntry.habbits, habbit],
				});
				dayEntry.habbits.push(habbit);
			} else {
				await setDoc(habbitsRef, {
					date: formattedDate,
					habbits: [habbit],
				});
				userHabbitsList.value.push({
					date: formattedDate,
					habbits: [habbit],
				});
			}
		} catch (error) {
			console.error("Error adding habbit to Firestore:", error);
		}
	}

	async function deleteHabbitFromSelectedDay(habbit) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userHabbitsList.value.find((day) => day.date === formattedDate);

		if (dayEntry) {
			const index = dayEntry.habbits.findIndex((t) => t.name === habbit.name);
			const updatedHabbits = [...dayEntry.habbits];
			updatedHabbits.splice(index, 1);
			if (index !== -1) {
				try {
					const habbitsRef = doc(db, "users", "user1", "habbits", formattedDate);
					await updateDoc(habbitsRef, {
						habbits: updatedHabbits,
					});
					dayEntry.habbits.splice(index, 1);
				} catch (error) {
					console.error("Error removing habbit from Firestore:", error);
				}
			}
		}
	}

	// Goals functions
	async function loadDailyGoals() {
        try {
            const userDocRef = doc(db, "users", "user1");
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().dailyGoals) {
                dailyGoalsList.value = userDoc.data().dailyGoals;
            } else {
                console.log("No dailyGoals found for the user.");
            }
        } catch (error) {
            console.error("Error loading dailyGoals from Firestore:", error);
        }
    }

	async function addDailyGoal(goal) {
		try {
			const newGoal = { ...goal, severity: goal.severity };
			const updatedList = [...dailyGoalsList.value, newGoal]; 
	
			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, { dailyGoals: updatedList });
	
			dailyGoalsList.value = updatedList;
			console.log("Daily goal added successfully.");
		} catch (error) {
			console.error("Error adding daily goal to Firestore:", error);
		}
	}
	
	async function deleteDailyGoal(goal) {
		try {
			const updatedList = dailyGoalsList.value.filter((g) => g.name !== goal.name); 
	
			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, { dailyGoals: updatedList });
	
			dailyGoalsList.value = updatedList;
			console.log("Daily goal deleted successfully.");
		} catch (error) {
			console.error("Error deleting daily goal from Firestore:", error);
		}
	}

	function onGoalClick(goal) {

		// It means that habbits is completed and we should remove habbit from current habbits
		if (goal.severity !== 'empty') {
			deleteHabbitFromSelectedDay(goal)
		}
		// And that means it's not so we should add it to the list
		else {
			// change severity to original 
			const goalFormatted = dailyGoalsList.value.find(g => g.name === goal.name)
			addHabbitToSelectedDay(goalFormatted)
		}

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
		loadDailyGoals
	};
});
