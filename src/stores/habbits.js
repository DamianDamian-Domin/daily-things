import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { formatDate, toDateKey, convertDateToDbFormat, formatDateToDbFormat } from '@/utils/timeUtils'
import { collection, query, where, getDocs } from "firebase/firestore";
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
	const dailyGoalsList = ref([
		{ name: "gym", icon: "fitness_center", severity: "success" },
		{ name: "cook", icon: "skillet", severity: "success" },
		{ name: "washing", icon: "local_laundry_service", severity: "success" },
	]);

	
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
			console.log(counters)

			if (counters[goal.name] <= currentDayTaskCount ) {
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

	// Firebase communication

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
	function addHabbitToSelectedDay(habbit) {

		const formattedDate = refDate.value.toISOString().split("T")[0];
		const dayEntry = userHabbitsList.value.find(
			(day) => day.date === formattedDate
		);

		if (dayEntry) {
			dayEntry.habbits.push(habbit);
		} else {
			userHabbitsList.value.push({
				date: formattedDate,
				habbits: [habbit],
			});
		}

	}

	function deleteHabbitFromSelectedDay(habbit) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userHabbitsList.value.find((day) => day.date === formattedDate);
	
		if (dayEntry) {
			const index = dayEntry.habbits.findIndex((t) => t.name === habbit.name);
			if (index !== -1) {
				dayEntry.habbits.splice(index, 1);
			}
		}
	}

	// Goals functions
	function addDailyGoal(goal) {
		const newGoal = {
			...goal,
			severity: goal.severity,
		};
		dailyGoalsList.value.push(newGoal);
	}

	function deleteDailyGoal(goal) {
		const index = dailyGoalsList.value.findIndex(g => g.name === goal.name)
		if (index !== -1) {
			dailyGoalsList.value.splice(index, 1)
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
		getDailyHabbitsInRange
	};
});
