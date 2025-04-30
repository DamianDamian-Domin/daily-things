import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useTasksStore = defineStore("tasks", () => {
	const refDate = ref(new Date());
	const dateFormated = computed(() => formatDate(refDate.value));

	function formatDate(date) {
		const options = {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			weekday: "long",
		};
		return date
			.toLocaleDateString("en-GB", options)
			.replace(/,/g, "")
			.split(" ");
	}

	function changeDate(direction) {
		refDate.value.setDate(refDate.value.getDate() + direction);
		refDate.value = new Date(refDate.value);
	}

	const allTasksList = ref([
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
	const dailyGoalsList = ref([
		[
			{ name: "gym", icon: "fitness_center", severity: "danger" },
			{ name: "cook", icon: "skillet", severity: "danger" },
			{ name: "washing", icon: "local_laundry_service", severity: "danger" },
		],
	]);
	const dailyTasksList = ref([
		{
			date: "2025-04-28",
			tasks: [
				{ name: "gym", icon: "fitness_center", severity: "success" },
				{ name: "cook", icon: "skillet", severity: "success" },
			],
			goals: [
				{ name: "gym", icon: "fitness_center", severity: "danger" },
				{ name: "cook", icon: "skillet", severity: "danger" },
				{ name: "washing", icon: "local_laundry_service", severity: "danger" },
			],
		},
		{
			date: "2025-04-27",
			tasks: [
				{ name: "gym", icon: "fitness_center", severity: "success" },
				{ name: "cook", icon: "skillet", severity: "success" },
				{ name: "washing", icon: "local_laundry_service", severity: "success" },
			],
			goals: [
				{ name: "gym", icon: "fitness_center", severity: "danger" },
				{ name: "cook", icon: "skillet", severity: "danger" },
				{ name: "washing", icon: "local_laundry_service", severity: "danger" },
			],
		},
		{
			date: "2025-04-26",
			tasks: [
				{ name: "gym", icon: "fitness_center", severity: "success" },
				{ name: "cook", icon: "skillet", severity: "success" },
				{ name: "washing", icon: "local_laundry_service", severity: "success" },
				{ name: "vacuum", icon: "vacuum", severity: "success" },
				{ name: "mop", icon: "mop", severity: "success" },
				{ name: "dishwasher", icon: "dishwasher", severity: "success" },
				{ name: "Meet", icon: "groups", severity: "success" },
				{ name: "Learn", icon: "school", severity: "success" },
				{ name: "shop", icon: "shopping_cart", severity: "success" },
				{ name: "bike", icon: "pedal_bike", severity: "success" },
				{
					name: "refuel the car",
					icon: "local_gas_station",
					severity: "success",
				},
				{ name: "wash the car", icon: "local_car_wash", severity: "success" },
				{ name: "Car repair", icon: "car_repair", severity: "success" },
				{ name: "Self Care", icon: "self_care", severity: "success" },
				{ name: "Dentist", icon: "dentistry", severity: "success" },
				{ name: "Gynecology", icon: "gynecology", severity: "success" },
				{
					name: "Stadia Controller",
					icon: "stadia_controller",
					severity: "success",
				},
			],
			goals: [
				{ name: "gym", icon: "fitness_center", severity: "danger" },
				{ name: "cook", icon: "skillet", severity: "danger" },
				{ name: "washing", icon: "local_laundry_service", severity: "danger" },
			],
		},
	]);
	function toDateKey(date) {
		return date.toISOString().split("T")[0];
	}

	const currentTasks = computed(() => {
		const key = toDateKey(refDate.value);
		const entry = dailyTasksList.value.find((item) => item.date === key);
		return entry ? entry.tasks : [];
	});

	function addTaskToDailyList(date, task) {
		const normalizedTask = {
			name: task.name,
			icon: task.icon,
			severity: task.severity,
		};
		const formattedDate = refDate.value.toISOString().split("T")[0];
		const dayEntry = dailyTasksList.value.find(
			(day) => day.date === formattedDate
		);

		if (dayEntry) {
			dayEntry.tasks.push(normalizedTask);
		} else {
			dailyTasksList.value.push({
				date: formattedDate,
				tasks: [normalizedTask],
				goals: [],
			});
		}
	}
	function deleteDailyTask(task) {
		dailyTasksList.value.forEach((day) => {
			const taskIndex = day.tasks.findIndex(
				(t) => t.name === task.name && t.icon === task.icon
			);
			if (taskIndex !== -1) {
				day.tasks.splice(taskIndex, 1);
			}
		});
	}

	const currentGoals = computed(() => {
		const key = toDateKey(refDate.value);
		const entry = dailyTasksList.value.find((item) => item.date === key);
		return entry ? entry.goals : [];
	});

	const reachGoal = (goalName) => {
		const key = toDateKey(refDate.value);
		const dayEntry = dailyTasksList.value.find((item) => item.date === key);

		if (!dayEntry) return;

		const goalIndex = dayEntry.goals.findIndex((g) => g.name === goalName);

		if (goalIndex === -1) return;

		const goal = dayEntry.goals[goalIndex];

		if (goal.severity === "danger") {
			goal.severity = "success";
		} else if (goal.severity === "success") {
			dayEntry.goals.splice(goalIndex, 1);
		}
	};

	function addGoalToDailyList(task) {
		const normalizedGoal = {
			name: task.name,
			icon: task.icon,
			severity: "danger",
		};

		const formattedDate = refDate.value.toISOString().split("T")[0];

		let dayEntry = dailyTasksList.value.find(
			(day) => day.date === formattedDate
		);

		if (dayEntry) {
			dayEntry.goals.push(normalizedGoal);
		} else {
			dailyTasksList.value.push({
				date: formattedDate,
				tasks: [],
				goals: [normalizedGoal],
			});
		}
	}

	return {
		refDate,
		dateFormated,
		changeDate,
		allTasksList,
		dailyTasksList,
		isToday,
		setDate,
		currentTasks,
		addTaskToDailyList,
		toDateKey,
		deleteDailyTask,
		currentGoals,
		reachGoal,
		addGoalToDailyList,
	};
});
