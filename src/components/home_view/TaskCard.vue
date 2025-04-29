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
					:data="task"></TaskItem>
			</div>
		</div>
	</Dialog>

	<div
		class="flex flex-col card-a sm:w-[480px] w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto">
		<div class="text-center">
			<h3 class="">You are doing well !</h3>
		</div>
		<div class="tasks-area mt-8 h-2/3">
			<div class="flex flex-row flex-wrap h-min gap-2">
				<TaskItem
					v-for="(task, index) in currentTasks"
					:key="index"
					:data="task"></TaskItem>
				<TaskItem
					@click="showAddTaskDialog = true"
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
</script>
