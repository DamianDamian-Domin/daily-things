<template>
	<Dialog
		v-model:visible="showHabbitDialog"
		modal
		dismissableMask
		:header="headerText"
		class="w-[clamp(20rem,50%,60rem)]">
		<div class="flex flex-col gap-4">
			<span class="p-text-secondary block mb-5">Update your information.</span>
			<div class="flex flex-row flex-wrap gap-2">
				<HabbitSearch @select="handleHabbitSelect" />
			</div>
		</div>
	</Dialog>

	<div
		class="flex flex-col card-a sm:w-[480px] surface-content w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto"
		@click.capture="handleGlobalClick">
		<div class="text-center">
			<h3 class="text-c">You are doing well !</h3>
		</div>
		<div class="tasks-area mt-8 h-2/3">
			<div class="flex flex-row flex-wrap h-min gap-2">
				<draggable
					v-model="selectedDayHabbits"
					item-key="id"
					class="flex flex-row flex-wrap h-min gap-2"
					ghost-class="opacity-40"
					:animation="150"
					@end="habbitsStore.updateHabbitsOrderInFirestore">
					<template #item="{ element }">
						<HabbitItem
							:data="getHabbitDisplayData(element)"
							:showTooltip="!editMode"
							@click="() => toggleMarkHabbit(element)" />
					</template>
				</draggable>
				<HabbitItem
					@click="openAddHabbitDialog"
					:showTooltip="!editMode"
					:data="{ severity: 'empty', icon: 'add', name: 'add' }" />
			</div>
		</div>

		<Divider></Divider>
		<div class="flex flex-col gap-6 flex-grow">
			<div class="text-center">
				<h3>Daily goals</h3>
			</div>
			<div
				class="text-right cursor-pointer"
				@click="toggleEditMode">
				<h4
					class="inline-block border-b text-border-success-hover-danger transition-colors">
					{{ editMode ? "Close edit goals" : "Edit goals" }}
				</h4>
			</div>
			<div
				ref="goalsContainerRef"
				class="flex flex-row flex-wrap h-min gap-2">
				<draggable
					v-if="editMode"
					v-model="dailyGoalsList"
					item-key="id"
					class="flex flex-row flex-wrap gap-2"
					ghost-class="opacity-40"
					:animation="150"
					@end="habbitsStore.updateGoalsOrderInFirestore">
					<template #item="{ element: goal }">
						<HabbitItem
							:data="getGoalDisplayData(goal)"
							:showTooltip="!editMode"
							@click="toggleMarkGoal(goal)" />
					</template>
				</draggable>
				<template v-else>
					<HabbitItem
						v-for="goal in dailyGoalsColored"
						:key="goal.id"
						:data="{
							...getFullGoalData(goal),
							severity: habbitsStore.getGoalSeverity(goal),
						}"
						:showTooltip="!editMode"
						@click="onReachGoal(goal)" />
				</template>
				<HabbitItem
					v-if="editMode"
					@click="openaddDailyGoalDialog"
					:data="{ severity: 'empty', icon: 'add', name: 'add' }" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import HabbitItem from "@/components/home_view/HabbitItem.vue";
import HabbitSearch from "@/components/home_view/HabbitSearch.vue";
import Divider from "primevue/divider";

import Dialog from "primevue/dialog";
import { ref, computed, onBeforeUnmount, nextTick } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import draggable from "vuedraggable";

import { Habbit, Goal } from "@/libs/types";

const habbitsStore = useHabbitsStore();
const {
	allHabbitsList,
	selectedDayHabbits,
	dailyGoalsColored,
	dailyGoalsList,
} = storeToRefs(habbitsStore);

const showHabbitDialog = ref(false);
const addDialogMode = ref("");
const selectedTaskToDelete = ref<Habbit | null>(null);
const selectedGoalToDelete = ref<Habbit | null>(null);

const headerText = computed(() =>
	addDialogMode.value === "habbit"
		? "Add a daily habbit"
		: "Add a goal to complete"
);
const editMode = ref(false);

function openAddHabbitDialog() {
	addDialogMode.value = "habbit";
	showHabbitDialog.value = true;
}

function openaddDailyGoalDialog() {
	addDialogMode.value = "goal";
	showHabbitDialog.value = true;
}

function handleHabbitSelect(habbit: Habbit) {
	if (addDialogMode.value === "habbit") {
		habbitsStore.addHabbitToSelectedDay(habbit);
	} else if (addDialogMode.value === "goal") {
		habbitsStore.addDailyGoal(habbit);
	}

	showHabbitDialog.value = false;
}

function deleteSelectedTask() {
	if (selectedTaskToDelete.value) {
		habbitsStore.deleteHabbitFromSelectedDay(selectedTaskToDelete.value);
	}
}
const onReachGoal = (goal: Goal) => {
	habbitsStore.onGoalClick(goal);
};

function toggleEditMode() {
	editMode.value = !editMode.value;
}

const markedGoalToDelete = ref<string | null>(null);
const goalsContainerRef = ref<Node | null>(null);

function handleClickOutside(event: MouseEvent) {
	if (
		goalsContainerRef.value &&
		!goalsContainerRef.value.contains(event.target as Node)
	) {
		markedGoalToDelete.value = null;
	}
}

function toggleMarkGoal(goal: Goal) {
	if (markedGoalToDelete.value === goal.id) {
		habbitsStore.deleteDailyGoal(goal);
		markedGoalToDelete.value = null; // reset selection
		document.removeEventListener("mousedown", handleClickOutside);
	} else {
		if (goal.id) {
			markedGoalToDelete.value = goal.id;
		}
		// Wait for DOM update to ensure ref is set
		nextTick(() => {
			document.addEventListener("mousedown", handleClickOutside);
		});
	}
}

// Clean up event listener on unmount
onBeforeUnmount(() => {
	document.removeEventListener("mousedown", handleClickOutside);
});

function getGoalDisplayData(goal: Goal) {
	const severity = habbitsStore.getGoalSeverity(goal);

	if (editMode.value && markedGoalToDelete.value === goal.id) {
		return {
			...goal,
			icon: "delete",
			severity: "danger",
		};
	}

	return {
		...goal,
		severity,
	};
}

function getFullGoalData(goal: Goal) {
	if (goal.display_name) return goal;
	const original = allHabbitsList.value.find((h) => h.name === goal.name);
	return original ? { ...original, ...goal } : goal;
}

function handleGlobalClick(event: MouseEvent) {
	const container = goalsContainerRef.value;
	if (
		editMode.value &&
		container &&
		!container.contains(event.target as Node)
	) {
		markedGoalToDelete.value = null;
	}
}
const markedHabbitToDelete = ref<string | null>(null);

function toggleMarkHabbit(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.id) {
		habbitsStore.deleteHabbitFromSelectedDay(habbit);
		markedHabbitToDelete.value = null;
		document.removeEventListener("mousedown", handleHabbitClickOutside);
	} else {
		if (habbit.id) {
			markedHabbitToDelete.value = habbit.id;
		}
		nextTick(() => {
			document.addEventListener("mousedown", handleHabbitClickOutside);
		});
	}
}

function handleHabbitClickOutside(event: MouseEvent) {
	const container = document.querySelector(".tasks-area");
	if (container && !container.contains(event.target as Node)) {
		markedHabbitToDelete.value = null;
		document.removeEventListener("mousedown", handleHabbitClickOutside);
	}
}

onBeforeUnmount(() => {
	document.removeEventListener("mousedown", handleClickOutside);
	document.removeEventListener("mousedown", handleHabbitClickOutside);
});

// This function is used to get the display data for a habbit, including its icon and severity.
// If the habbit is marked for deletion, it will show a delete icon and danger severity
function getHabbitDisplayData(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.id) {
		return {
			...habbit,
			icon: "delete",
			severity: "danger",
		};
	}
	return getFullHabbitData(habbit);
}
// This function merges the habbit data with the original data from allHabbitsList to ensure
// that we have the most complete information, especially for display_name and icon.
function getFullHabbitData(habbit: Habbit) {
	// Jeśli już jest display_name, zwróć oryginał
	if (habbit.display_name) return habbit;
	// Szukaj w allHabbitsList po name
	const original = allHabbitsList.value.find((h) => h.name === habbit.name);
	return original ? { ...original, ...habbit } : habbit;
}
</script>
@/stores/habbits
