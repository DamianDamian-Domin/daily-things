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
					@select="handleTaskSelect(task)"
					@click="showTaskDialog = false"></TaskItem>
			</div>
		</div>
	</Dialog>

	<Dialog
		v-model:visible="showDeleteTaskDialog"
		modal
		:dismissableMask="true"
		header="Are You realy whant delete this?">
		<div class="w-[clamp(20rem,50%,60rem)]">
			<div>
				<button
					@click="closeDeleteTaskDialog"
					class="cancel-button">
					Back
				</button>
				<button
					@click="deleteSelectedTask()"
					class="delete-button">
					Delete
				</button>
			</div>
		</div>
	</Dialog>

	<div
		class="flex flex-col card-a sm:w-[480px] w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto">
		<div class="text-center">
			<h3>You are doing well !</h3>
		</div>
		<div class="tasks-area mt-8 h-2/3">
			<div class="flex flex-row flex-wrap h-min gap-2">
				<TaskItem
					v-for="(task, index) in currentTasks"
					:key="index"
					:data="task"
					@click="openDeleteTaskDialog(task)" />
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
			<div class="flex flex-row flex-wrap h-min gap-2">
				<TaskItem
					v-for="goal in currentGoals"
					:key="goal.name"
					:data="goal"
					@click="onReachGoal(goal)"></TaskItem>
				<TaskItem
					@click="openAddGoalDialog"
					:data="{ severity: 'empty', icon: 'add' }"></TaskItem>
			</div>
		</div>
	</div>
</template>

<script setup>
import TaskItem from "@/components/home_view/TaskItem.vue";
import Divider from "primevue/divider";
import Dialog from "primevue/dialog";
import { ref, computed } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { storeToRefs } from "pinia";

const tasksStore = useTasksStore();
const { allTasksList, currentTasks, currentGoals } = storeToRefs(tasksStore);

const showTaskDialog = ref(false);
const addDialogMode = ref("");

const headerText = computed(() =>
	addDialogMode.value === "task" ? "Add a daily task" : "Add a goal to complete"
);

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
		tasksStore.addGoalToDailyList(task);
	}

	showTaskDialog.value = false;
}

const showDeleteTaskDialog = ref(false);
const selectedTaskToDelete = ref(null);

function openDeleteTaskDialog(task) {
	console.log("TAK");
	selectedTaskToDelete.value = task;
	showDeleteTaskDialog.value = true;
}

function closeDeleteTaskDialog() {
	selectedTaskToDelete.value = null;
	showDeleteTaskDialog.value = false;
	console.log("NIE");
}

function deleteSelectedTask() {
	if (selectedTaskToDelete.value) {
		tasksStore.deleteDailyTask(selectedTaskToDelete.value);
		closeDeleteTaskDialog();
	}
}
const onReachGoal = (goal) => {
	tasksStore.reachGoal(goal.name);
};
</script>
