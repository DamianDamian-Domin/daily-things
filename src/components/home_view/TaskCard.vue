<template>
	<Dialog
		v-model:visible="showAddTaskDialog"
		modal
		header="Add task"
		class="w-[clamp(20rem,50%,60rem)]">
		<div class="flex flex-col gap-4">
			<span class="p-text-secondary block mb-5">Update your information.</span>
			<div class="flex flex-row flex-wrap gap-2">
				<TaskItem
					v-for="task in allTasksList"
					:key="task.icon"
					:data="task"
					@select="handleTaskSelect(task)"
					@click="showAddTaskDialog = false"></TaskItem>
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
					@click="showAddTaskDialog = true"
					:data="{ severity: 'empty', icon: 'add' }"></TaskItem>
			</div>
		</div>
		<Divider></Divider>
		<div class="flex flex-col gap-6 flex-grow">
			<div class="text-center">
				<h3>Weekly goals</h3>
			</div>
			<div class="flex flex-row flex-wrap h-min gap-2">
				<TaskItem
					v-for="task in 4"
					:key="task"
					:data="{ severity: 'empty', icon: 'fitness_center' }"></TaskItem>
				<TaskItem :data="{ severity: 'empty', icon: 'add' }"></TaskItem>
			</div>
		</div>
	</div>
</template>

<script setup>
import TaskItem from "@/components/home_view/TaskItem.vue";
import Divider from "primevue/divider";
import Dialog from "primevue/dialog";
import { ref } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { storeToRefs } from "pinia";

const tasksStore = useTasksStore();
const { allTasksList, currentTasks } = storeToRefs(tasksStore);

const showAddTaskDialog = ref(false);

function handleTaskSelect(task) {
	const today = new Date().toISOString().slice(0, 10);
	tasksStore.addTaskToDailyList(today, task);
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
</script>
