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
		class="flex flex-col card-a sm:w-[480px] surface-content w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto">
		<div class="text-center">
			<h3 class="text-c">You are doing well !</h3>
		</div>
		<div class="tasks-area mt-8 h-2/3">
			<div class="flex flex-row flex-wrap h-min gap-2">
				<HabbitItem
					v-for="(habbit, index) in selectedDayHabbits"
					:key="index"
					:data="habbit"
					@click="(e) => showTemplate(e, habbit)" />
				<HabbitItem
					@click="openAddHabbitDialog"
					:data="{ severity: 'empty', icon: 'add' }"></HabbitItem>
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
			<div class="flex flex-row flex-wrap h-min gap-2">
				<HabbitItem
					v-for="goal in dailyGoalsColored"
					:key="goal.name"
					:data="goal"
					@click="
						(e) => (editMode ? showGoalDeletePopup(e, goal) : onReachGoal(goal))
					" />
				<HabbitItem
					v-if="editMode"
					@click="openaddDailyGoalDialog"
					:data="{ severity: 'empty', icon: 'add' }" />
			</div>
		</div>
	</div>
</template>

<script setup>
import HabbitItem from "@/components/home_view/HabbitItem.vue";
import Divider from "primevue/divider";
import Dialog from "primevue/dialog";
import ConfirmPopup from "primevue/confirmpopup";
import { ref, computed } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";

import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const habbitsStore = useHabbitsStore();
const { allHabbitsList, selectedDayHabbits, dailyGoalsColored } =
	storeToRefs(habbitsStore);

const showHabbitDialog = ref(false);
const addDialogMode = ref("");
const selectedTaskToDelete = ref(null);
const selectedGoalToDelete = ref(null);

const headerText = computed(() =>
	addDialogMode.value === "habbit" ? "Add a daily habbit" : "Add a goal to complete"
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

function handleHabbitSelect(habbit) {
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
const onReachGoal = (goal) => {
	habbitsStore.onGoalClick(goal);
};

const showTemplate = (event, habbit) => {
	selectedTaskToDelete.value = habbit;
	confirm.require({
		target: event.currentTarget2,
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
			deleteSelectedTask(habbit);
		},
	});
};

function toggleEditMode() {
	editMode.value = !editMode.value;
}

const showGoalDeletePopup = (event, goal) => {
	selectedGoalToDelete.value = goal;

	confirm.require({
		target: event.currentTarget,
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
			habbitsStore.deleteDailyGoal(selectedGoalToDelete.value);
			selectedGoalToDelete.value = null;
		},
	});
};


</script>
@/stores/habbits