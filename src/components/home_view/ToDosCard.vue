<template>
	<div
		class="flex flex-col card-a sm:w-[480px] surface-content w-full h-[80vh] min-h-[30rem] max-h-[30rem] overflow-hidden">
		<div
			class="flex flex-col h-full"
			:class="!isActive && 'pointer-events-none'">
			<div class="flex-none text-center mb-3 pt-4">
				<h3 class="text-c font-lora italic">To-do list 📝</h3>
			</div>

			<div class="flex-1 min-h-0 overflow-y-auto mx-4 pb-4">
				<div
					v-for="item in selectedDayTodos"
					:key="item.id"
					class="flex items-start gap-4 mb-3 group cursor-pointer"
					@click="openEditDialog(item)">
					<div class="w-6 flex justify-center mt-0.5">
						<button
							class="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors duration-200 shrink-0"
							:class="
								item.completed
									? 'bg-green-500 border-green-500 text-white'
									: 'border-gray-400 group-hover:border-green-500'
							"
							@click.stop="toggleCompletion(item)">
							<i
								v-if="item.completed"
								class="pi pi-check text-xs"></i>
						</button>
					</div>

					<div class="flex-1 min-w-0 flex justify-between items-start gap-3">
						<span
							class="block break-words transition-all duration-200"
							:class="[
								item.completed
									? 'line-through text-gray-400 dark:text-gray-600'
									: 'text-gray-800 dark:text-gray-200 group-hover:text-green-500 dark:group-hover:text-green-400',
							]">
							{{ item.text }}
						</span>

						<div
							v-if="item.description"
							class="shrink-0 mt-1 cursor-help"
							title="This task has a description">
							<i
								class="pi pi-align-left text-gray-300 dark:text-gray-500 text-sm group-hover:text-green-400 transition-colors"></i>
						</div>
					</div>
				</div>

				<div
					class="flex items-center gap-4 mt-4 cursor-pointer text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200"
					@click="openAddDialog">
					<div class="w-6 flex justify-center">
						<i class="pi pi-plus text-sm"></i>
					</div>
					<span>Add a task...</span>
				</div>
			</div>

			<div
				class="flex-none pb-4 flex flex-col items-center gap-2 border-t border-gray-100 dark:border-gray-600 pt-4">
				<span class="text-c text-gray-500">All tasks</span>
				<div
					class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-green-500 text-lg font-medium text-gray-800 dark:text-gray-200">
					{{ totalCount }}
				</div>
			</div>
		</div>

		<Dialog
			v-model:visible="isDialogOpen"
			modal
			dismissableMask
			:closable="false"
			:header="dialogMode === 'add' ? 'New task' : 'Edit task'"
			class="w-[clamp(20rem,50%,60rem)]"
			@show="focusInput">
			<div class="flex flex-col gap-4">
				<span class="p-text-secondary block mb-2">
					{{
						dialogMode === "add"
							? "What do you want to do today? ✍️"
							: "Update the task details."
					}}
				</span>

				<div class="flex flex-col gap-3">
					<input
						v-model="dialogText"
						ref="dialogInput"
						type="text"
						class="p-inputtext p-component w-full font-semibold text-lg bg-transparent border-none !shadow-none !outline-none px-0 focus:ring-0 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
						placeholder="Task name..."
						@keydown.enter.prevent="focusDescription" />

					<textarea
						v-model="dialogDescription"
						ref="descriptionInput"
						class="p-inputtext p-component w-full h-32 resize-none bg-transparent border-none !shadow-none !outline-none px-0 focus:ring-0 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
						placeholder="Add a description, notes, or subtasks..."
						@keydown.ctrl.enter.prevent="saveTask"
						@keydown.meta.enter.prevent="saveTask"></textarea>
				</div>

				<div
					class="flex justify-between items-center mt-2 border-t border-gray-100 dark:border-gray-600 pt-4">
					<div>
						<button
							v-if="dialogMode === 'edit'"
							@click="deleteCurrentTask"
							class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
							<i class="pi pi-trash"></i>
							<span>Delete</span>
						</button>
					</div>

					<div class="flex gap-2">
						<button
							@click="closeDialog"
							class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
							Cancel
						</button>
						<button
							@click="saveTask"
							:disabled="!dialogText.trim()"
							class="px-4 py-2 rounded-lg font-medium transition-colors text-white"
							:class="
								dialogText.trim()
									? 'bg-green-500 hover:bg-green-600'
									: 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
							">
							Save
						</button>
					</div>
				</div>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTodosStore } from "@/stores/todos";
import Dialog from "primevue/dialog";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const { selectedDayTodos } = storeToRefs(todosStore);

const totalCount = computed(() => selectedDayTodos.value.length);

	/* =========================
	   DIALOG STATE
	========================= */
const isDialogOpen = ref(false);
const dialogMode = ref<"add" | "edit">("add");
const dialogText = ref("");
const dialogDescription = ref("");
const currentEditId = ref<string | null>(null);

const dialogInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);

/* =========================
   LOAD
========================= */
onMounted(() => {
	todosStore.loadTodos();
});

	/* =========================
	   TASK MANAGEMENT
	========================= */
function toggleCompletion(item: any) {
	if (todosStore.toggleTodo) {
		todosStore.toggleTodo(item.id);
	}
}

	/* =========================
	   DIALOG HANDLERS
	========================= */
function openAddDialog() {
	dialogMode.value = "add";
	dialogText.value = "";
	dialogDescription.value = "";
	currentEditId.value = null;
	isDialogOpen.value = true;
}

function openEditDialog(item: any) {
	dialogMode.value = "edit";
	dialogText.value = item.text;
	dialogDescription.value = item.description || "";
	currentEditId.value = item.id;
	isDialogOpen.value = true;
}

function closeDialog() {
	isDialogOpen.value = false;
	dialogText.value = "";
	dialogDescription.value = "";
	currentEditId.value = null;
}

function saveTask() {
	const text = dialogText.value.trim();
	const description = dialogDescription.value.trim();

	if (!text) {
		if (dialogMode.value === "edit" && currentEditId.value) {
			todosStore.deleteTodo(currentEditId.value);
		}
		closeDialog();
		return;
	}

	if (dialogMode.value === "add") {
		todosStore.addTodo(text, description);
	} else if (dialogMode.value === "edit" && currentEditId.value) {
		todosStore.updateTodo(currentEditId.value, text, description);
	}

	closeDialog();
}

function deleteCurrentTask() {
	if (currentEditId.value) {
		todosStore.deleteTodo(currentEditId.value);
	}
	closeDialog();
}

function focusDescription() {
	if (descriptionInput.value) {
		descriptionInput.value.focus();
	}
}

function focusInput() {
	if (dialogInput.value) {
		dialogInput.value.focus();
	}
}
</script>
