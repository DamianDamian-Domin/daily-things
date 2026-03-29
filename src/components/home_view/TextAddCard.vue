<template>
	<div
		class="flex flex-col card-a sm:w-[480px] surface-content w-full h-[80vh] min-h-[30rem] max-h-[30rem] overflow-hidden">
		<div
			class="flex flex-col h-full"
			:class="!isActive && 'pointer-events-none'">
			<!-- Header -->
			<div class="flex-none text-center mb-3">
				<h3 class="text-c">To do list</h3>
			</div>

			<!-- Input -->
			<div class="flex-none mx-4">
				<div class="flex items-center gap-4">
					<div class="w-6 flex justify-center">
						<div class="w-[22px] h-[22px] rounded-full border-2"></div>
					</div>

					<div class="flex-1 min-w-0 mb-3">
						<textarea
							v-model="newText"
							rows="1"
							class="w-full border-b border-dotted bg-transparent outline-none resize-none px-2 py-1"
							@keydown.enter.prevent="addItem"
							@blur="addItem" />
					</div>
				</div>
			</div>

			<!-- LIST -->
			<div class="flex-1 min-h-0 overflow-y-auto mx-4">
				<div
					v-for="item in selectedDayTodos"
					:key="item.id"
					class="flex items-center gap-4 mb-1">
					<div class="w-6 flex justify-center">
						<div
							class="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
							:class="{
								'bg-red-500 border-red-500 text-white':
									markedTaskId === item.id,
								'bg-green-500 border-green-500 text-white':
									item.completed && markedTaskId !== item.id,
							}"
							@click.stop="toggleMarkTask(item)">
							<i
								v-if="markedTaskId === item.id"
								class="pi pi-trash text-xs"></i>
							<i
								v-else-if="item.completed"
								class="pi pi-check text-xs"></i>
						</div>
					</div>

					<div class="flex-1 min-w-0">
						<textarea
							v-if="editingId === item.id"
							v-model="editingText"
							class="w-full border-b border-dotted bg-transparent outline-none resize-none px-2 py-1"
							rows="1"
							@keydown.enter.prevent="confirmEdit(item)"
							@blur="confirmEdit(item)"
							autofocus />

						<span
							v-else
							class="block w-full cursor-pointer"
							:class="{ 'line-through opacity-60': markedTaskId === item.id }"
							@click.stop="startEdit(item)">
							{{ item.text }}
						</span>
					</div>
				</div>
			</div>

			<!-- Counter -->
			<div class="flex-none pt-4 flex flex-col items-center gap-2">
				<span class="text-c text-gray-500"> Total Count </span>

				<div
					class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-green-500 text-lg font-medium">
					{{ totalCount }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTodosStore } from "@/stores/todos";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const { selectedDayTodos } = storeToRefs(todosStore);

const newText = ref("");

const editingId = ref<string | null>(null);
const editingText = ref("");

const markedTaskId = ref<string | null>(null);

const totalCount = computed(() => selectedDayTodos.value.length);

/* =========================
   LOAD
========================= */

onMounted(() => {
	todosStore.loadTodos();
});

/* =========================
   ADD
========================= */

function addItem() {
	const text = newText.value.trim();
	if (!text) return;

	todosStore.addTodo(text);
	newText.value = "";
}

/* =========================
   DELETE / MARK
========================= */

function toggleMarkTask(item: any) {
	if (editingId.value === item.id) return;

	if (markedTaskId.value === item.id) {
		deleteTask(item);
		markedTaskId.value = null;
		return;
	}

	markedTaskId.value = item.id;
}

function deleteTask(item: any) {
	todosStore.deleteTodo(item.id);
}

/* =========================
   EDIT
========================= */

function startEdit(item: any) {
	if (markedTaskId.value === item.id) {
		markedTaskId.value = null;
	}

	editingId.value = item.id;
	editingText.value = item.text;
}

function confirmEdit(item: any) {
	const text = editingText.value.trim();

	if (!text) {
		deleteTask(item);
	} else {
		todosStore.updateTodo(item.id, text);
	}

	editingId.value = null;
	editingText.value = "";
}
</script>
