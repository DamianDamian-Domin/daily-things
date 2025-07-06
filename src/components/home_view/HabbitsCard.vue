<template>
	<Dialog
		v-model:visible="showHabbitDialog"
		modal
		:header="headerText"
		class="w-[clamp(20rem,50%,60rem)]">
		<div class="flex flex-col gap-4">
			<span class="p-text-secondary block mb-5">Update your information.</span>
			<div class="flex flex-row flex-wrap gap-2">
				<HabbitItem
					v-for="habbit in allHabbitsList"
					:key="habbit.icon"
					:data="habbit"
					@select="handleHabbitSelect"
					@click="showHabbitDialog = false"></HabbitItem>
			</div>
		</div>
	</Dialog>

	<ConfirmPopup group="templating">
		<template #message="slotProps">
			<div
				class="flex flex-col items-center w-full gap-4 border-b border-surface-200 dark:border-surface-700 p-4 mb-4 pb-0">
				<i
					:class="slotProps.message.icon"
					class="text-6xl text-primary-500"></i>
				<p>{{ slotProps.message.message }}</p>
			</div>
		</template>
	</ConfirmPopup>

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
					item-key="name"
					class="flex flex-row flex-wrap h-min gap-2"
					ghost-class="opacity-40"
					:animation="150">
					<template #item="{ element }">
						<HabbitItem
							:data="getHabbitDisplayData(element)"
							@click="() => toggleMarkHabbit(element)" />
					</template>
				</draggable>
				<HabbitItem
					@click="openAddHabbitDialog"
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
					class="inline-block border-b border-gray-300 hover:text-blue-600 transition-colors">
					{{ editMode ? "Close edit goals" : "Edit goals" }}
				</h4>
			</div>
			<div
				ref="goalsContainerRef"
				class="flex flex-row flex-wrap h-min gap-2">
				<draggable
					v-if="editMode"
					v-model="dailyGoalsList"
					item-key="name"
					class="flex flex-row flex-wrap gap-2"
					ghost-class="opacity-40"
					:animation="150">
					<template #item="{ element }">
						<HabbitItem
							:data="getGoalDisplayData(element)"
							@click="toggleMarkGoal(element)" />
					</template>
				</draggable>
				<template v-else>
					<HabbitItem
						v-for="goal in dailyGoalsColored"
						:key="goal.name"
						:data="getGoalDisplayData(goal)"
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
import Divider from "primevue/divider";
import Dialog from "primevue/dialog";
import ConfirmPopup from "primevue/confirmpopup";
import { ref, computed, onBeforeUnmount, nextTick } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import draggable from "vuedraggable";

import { useConfirm } from "primevue/useconfirm";
import { Habbit, Goal } from "@/libs/types";

const confirm = useConfirm();

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

const showTemplate = (event: MouseEvent, habbit: Habbit) => {
	selectedTaskToDelete.value = habbit;
	confirm.require({
		target: event.currentTarget as HTMLElement,
		group: "templating",
		message: "Please confirm to proceed moving forward.",
		icon: "pi pi-exclamation-circle",
		rejectProps: {
			icon: "pi pi-times",
			label: "Cancel",
			outlined: true,
		},
		acceptProps: {
			icon: "pi pi-check",
			label: "Confirm",
		},
		accept: () => {
			deleteSelectedTask();
		},
	});
};

function toggleEditMode() {
	editMode.value = !editMode.value;
}

const showGoalDeletePopup = (event: MouseEvent, goal: Goal) => {
	selectedGoalToDelete.value = goal;

	confirm.require({
		target: event.currentTarget as HTMLElement,
		group: "templating",
		message: `Are you sure you want to delete "${goal.name}" from your goals?`,
		icon: "pi pi-exclamation-circle",
		rejectProps: {
			icon: "pi pi-times",
			label: "Cancel",
			outlined: true,
		},
		acceptProps: {
			icon: "pi pi-check",
			label: "Confirm",
		},
		accept: () => {
			if (!selectedGoalToDelete.value) return;
			habbitsStore.deleteDailyGoal(selectedGoalToDelete.value);
			selectedGoalToDelete.value = null;
		},
	});
};

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
	if (markedGoalToDelete.value === goal.name) {
		habbitsStore.deleteDailyGoal(goal);
		markedGoalToDelete.value = null; // reset selection
		document.removeEventListener("mousedown", handleClickOutside);
	} else {

		markedGoalToDelete.value = goal.name;
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
	if (editMode.value && markedGoalToDelete.value === goal.name) {
		return {
			...goal,
			icon: "delete",
			severity: "danger",
		};
	}

	return goal;
}

function handleGlobalClick(event: MouseEvent) {
	const container = goalsContainerRef.value;
	if (editMode.value && container && !container.contains(event.target as Node)) {
		markedGoalToDelete.value = null;
	}
}
const markedHabbitToDelete = ref<string |null>(null);

function toggleMarkHabbit(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.name) {
		habbitsStore.deleteHabbitFromSelectedDay(habbit);
		markedHabbitToDelete.value = null;
		document.removeEventListener("mousedown", handleHabbitClickOutside);
	} else {
		markedHabbitToDelete.value = habbit.name;
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

function getHabbitDisplayData(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.name) {
		return {
			...habbit,
			icon: "delete",
			severity: "danger",
		};
	}
	return habbit;
}
</script>
@/stores/habbits
