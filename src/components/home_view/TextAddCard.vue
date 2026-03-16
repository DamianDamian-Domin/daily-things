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

			<!-- Sticky input -->
			<div class="flex-none mx-4">
				<div class="flex items-center gap-4">
					<!-- IKONA -->
					<div class="w-6 flex justify-center">
						<div
							class="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-c"></div>
					</div>

					<!-- INPUT -->
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

			<!-- Scroll area -->
			<div class="flex-1 min-h-0 flex flex-col">
				<div class="flex-1 min-h-0 overflow-y-auto mx-4">
					<!-- lista zadań -->
					<div
						v-for="item in items"
						:key="item.id"
						class="flex items-center gap-4 mb-1">
						<!-- ICON -->
						<div class="w-6 flex justify-center">
							<div
								class="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all"
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

						<!-- TEXT / EDIT -->
						<div class="flex-1 min-w-0">
							<textarea
								v-if="editingId === item.id"
								v-model="editingText"
								class="w-full border-b border-dotted bg-transparent outline-none resize-none px-2 py-1 rounded"
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
import { ref, computed } from "vue";
import { useTodosStore } from "@/stores/todos";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const todosStore = useTodosStore();
const { selectedDayTodos } = storeToRefs(todosStore);

defineProps<{ isActive: boolean }>();

interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
}

const items = selectedDayTodos;
const newText = ref("");

const editingId = ref<string | null>(null);
const editingText = ref("");

const markedTaskId = ref<string | null>(null);

const totalCount = computed(() => items.value.length);

function generateId() {
	return crypto.randomUUID();
}

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

function toggleMarkTask(item: TodoItem) {
	// blokada podczas edycji
	if (editingId.value === item.id) return;

	if (markedTaskId.value === item.id) {
		deleteTask(item);
		markedTaskId.value = null;
		return;
	}

	markedTaskId.value = item.id;
}

function deleteTask(item: TodoItem) {
	todosStore.deleteTodo(item.id);
}

/* =========================
   EDIT
========================= */

function startEdit(item: TodoItem) {
	if (markedTaskId.value === item.id) {
		markedTaskId.value = null;
	}

	editingId.value = item.id;
	editingText.value = item.text;
}

function confirmEdit(item: TodoItem) {
	const text = editingText.value.trim();

	if (!text) {
		deleteTask(item);
	} else {
		todosStore.updateTodo(item.id, text);
	}

	editingId.value = null;
	editingText.value = "";
}
onMounted(() => {
	todosStore.loadTodosForDate(new Date());
});
onMounted(() => {
	todosStore.loadTodosForDate(new Date());
});
</script>
<style scoped>
/* <-- Input area --> */
.line-input {
	width: 100%;
	border: none;
	border-bottom: 1px dotted var(--surface-border);
	background: transparent;
	outline: none;
	font-size: 1rem;
	resize: none;
	padding: 0.4rem 0.5rem;
	border-radius: 6px;
}

/* <-- counter --> */
.counter {
	width: 48px;
	height: 48px;

	display: flex;
	align-items: center;
	justify-content: center;

	margin: 1.5rem auto 0 auto;

	border-radius: 50%;
	border: 3px solid #22c55e;

	font-weight: 400;
	font-size: 1.5rem;

	background: transparent;
}
</style>
