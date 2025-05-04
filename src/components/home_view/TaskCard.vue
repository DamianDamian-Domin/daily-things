<template>
	<Dialog
		v-model:visible="showTaskDialog"
		modal
		:header="headerText"
		class="w-[clamp(20rem,50%,60rem)]">
		<div class="flex flex-col gap-4">
			<span class="p-text-secondary block mb-5">Update your information.</span>
			<div class="flex flex-row flex-wrap gap-2">
				<TaskItem
					v-for="task in allTasksList"
					:key="task.icon"
					:data="task"
					@select="handleTaskSelect"
					@click="showTaskDialog = false"></TaskItem>
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
			<h3 class="text">You are doing well !</h3>
		</div>
		<div class="tasks-area mt-8 h-2/3">
			<div class="flex flex-row flex-wrap h-min gap-2">
				<TaskItem
					v-for="(task, index) in currentTasks"
					:key="index"
					:data="task"
					@click="(e) => showTemplate(e, task)" />
				<TaskItem
					@click="openAddTaskDialog"
					:data="{ severity: 'empty', icon: 'add' }"></TaskItem>
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
				<TaskItem
					v-for="goal in dailyGoalsList"
					:key="goal.name"
					:data="goal"
					@click="
						(e) => (editMode ? showGoalDeletePopup(e, goal) : onReachGoal(goal))
					" />
				<TaskItem
					v-if="editMode"
					@click="openAddGoalDialog"
					:data="{ severity: 'empty', icon: 'add' }" />
			</div>
		</div>
	</div>
</template>

<script setup>
import TaskItem from "@/components/home_view/TaskItem.vue";
import Divider from "primevue/divider";
import Dialog from "primevue/dialog";
import ConfirmPopup from "primevue/confirmpopup";
import { ref, computed } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { storeToRefs } from "pinia";

import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const tasksStore = useTasksStore();
const { allTasksList, currentTasks, dailyGoalsList, completeGoal } =
	storeToRefs(tasksStore);

const showTaskDialog = ref(false);
const addDialogMode = ref("");
const selectedTaskToDelete = ref(null);
const selectedGoalToDelete = ref(null);

const headerText = computed(() =>
	addDialogMode.value === "task" ? "Add a daily task" : "Add a goal to complete"
);
const editMode = ref(false);

function openAddTaskDialog() {
	addDialogMode.value = "task";
	showTaskDialog.value = true;
}

function openAddGoalDialog() {
	addDialogMode.value = "goal";
	showTaskDialog.value = true;
}

function handleTaskSelect(task) {
	const today = new Date().toISOString().slice(0, 10);

	if (addDialogMode.value === "task") {
		tasksStore.addTaskToDailyList(today, task);
	} else if (addDialogMode.value === "goal") {
		tasksStore.addGoal(task);
	}

	showTaskDialog.value = false;
}

function deleteSelectedTask() {
	if (selectedTaskToDelete.value) {
		tasksStore.deleteDailyTask(selectedTaskToDelete.value);
	}
}
const onReachGoal = (goal) => {
	tasksStore.completeGoal(goal);
};

const showTemplate = (event, task) => {
	selectedTaskToDelete.value = task;
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
			deleteSelectedTask(task);
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
			tasksStore.deleteDailyGoal(selectedGoalToDelete.value);
			selectedGoalToDelete.value = null;
		},
	});
};

function deleteGoalFromDailyGoalsList() {
	if (selectedGoalToDelete.value)
		tasksStore.deleteDailyGoal(selectedGoalToDelete.value);

	selectedGoalToDelete.value = null;
}
</script>
