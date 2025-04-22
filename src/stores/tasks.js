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

	const dailyTasksMap = ref(new Map());

	function toDateKey(date) {
		return date.toISOString().split("T")[0];
	}

	dailyTasksMap.value.set("2025-04-16", [
		{ name: "gym", icon: "fitness_center", severity: "success" },
		{ name: "cook", icon: "skillet", severity: "success" },
	]);

	dailyTasksMap.value.set("2025-04-15", [
		{ name: "gym", icon: "fitness_center", severity: "success" },
		{ name: "cook", icon: "skillet", severity: "success" },
		{ name: "washing", icon: "local_laundry_service", severity: "success" },
	]);

	dailyTasksMap.value.set("2025-04-14", [
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
		{ name: "refuel the car", icon: "local_gas_station", severity: "success" },
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
	]);

	const currentTasks = computed(() => {
		const key = toDateKey(refDate.value);
		return dailyTasksMap.value.get(key) || [];
	});

	return {
		refDate,
		dateFormated,
		changeDate,
		allTasksList,
		dailyTasksMap,
		isToday,
		setDate,
		currentTasks,
	};
});
