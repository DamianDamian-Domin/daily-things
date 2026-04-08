<template>
	<div class="td-card card-a sm:w-[480px] surface-content w-full h-full min-h-[30rem] max-h-[50rem]">
		<div
			class="td-inner"
			:class="!isActive && 'pointer-events-none'">

			<!-- Header with progress ring -->
			<div class="td-top">
				<h3 class="td-title">To-do list 📝</h3>
				<div
					class="td-ring-wrap"
					v-tooltip.bottom="completedCount + '/' + totalCount + ' done'">
					<svg class="td-ring" viewBox="0 0 36 36">
						<circle
							class="td-ring-bg"
							cx="18" cy="18" r="15.5"
							fill="none"
							stroke-width="2.5" />
						<circle
							class="td-ring-progress"
							cx="18" cy="18" r="15.5"
							fill="none"
							stroke-width="2.5"
							stroke-linecap="round"
							:stroke-dasharray="ringCircumference"
							:stroke-dashoffset="ringOffset"
							:style="{ stroke: progressStrokeColor }"
							transform="rotate(-90 18 18)" />
					</svg>
					<span class="td-ring-text">{{ completedCount }}/{{ totalCount }}</span>
				</div>
			</div>

			<!-- Task list -->
			<div class="td-list">
				<!-- Active tasks -->
				<div
					v-for="item in activeTodos"
					:key="item.id"
					class="td-item">
					<button
						class="td-check"
						@click="toggleCompletion(item)">
						<span class="td-check-inner"></span>
					</button>
					<span class="td-item-text" @click="openEditDialog(item)">
						{{ item.text }}
					</span>
					<i
						v-if="item.description"
						class="pi pi-align-left td-item-desc-icon"
						v-tooltip.bottom="'Has notes'"></i>
				</div>

				<!-- Inline add input -->
				<div class="td-add-row">
					<div class="td-add-icon-wrap">
						<i class="pi pi-plus td-add-icon"></i>
					</div>
					<input
						ref="inlineInput"
						v-model="inlineText"
						type="text"
						class="td-add-input"
						placeholder="Add a task..."
						@keydown.enter.prevent="submitInline"
						@keydown.escape="cancelInline" />
				</div>

				<!-- Completed tasks (collapsed section) -->
				<template v-if="completedTodos.length > 0">
					<button class="td-done-toggle" @click="showCompleted = !showCompleted">
						<i
							class="pi td-done-chevron"
							:class="showCompleted ? 'pi-chevron-down' : 'pi-chevron-right'"
							style="font-size: 0.6rem"></i>
						<span>{{ completedTodos.length }} completed</span>
					</button>
					<Transition name="td-slide">
						<div v-if="showCompleted" class="td-completed-list">
							<div
								v-for="item in completedTodos"
								:key="item.id"
								class="td-item td-item-done">
								<button
									class="td-check td-check-done"
									@click="toggleCompletion(item)">
									<i class="pi pi-check" style="font-size: 0.55rem"></i>
								</button>
								<span class="td-item-text td-text-done" @click="openEditDialog(item)">
									{{ item.text }}
								</span>
							</div>
						</div>
					</Transition>
				</template>

				<!-- Empty state -->
				<div v-if="totalCount === 0" class="td-empty">
					<span class="td-empty-emoji">📋</span>
					<p class="td-empty-text">No tasks yet — type above to add one</p>
				</div>
			</div>
		</div>

		<!-- Edit dialog (only for editing existing tasks) -->
		<Dialog
			v-model:visible="isDialogOpen"
			modal
			dismissableMask
			:show-header="false"
			class="td-dialog w-[clamp(20rem,80vw,36rem)]">
			<div class="td-dialog-inner">
				<h4 class="td-dialog-title">Edit task ✏️</h4>
				<input
					v-model="dialogText"
					ref="dialogInput"
					type="text"
					class="td-dialog-input"
					placeholder="Task name..."
					@keydown.enter.prevent="focusDescription" />
				<textarea
					v-model="dialogDescription"
					ref="descriptionInput"
					class="td-dialog-textarea"
					placeholder="Notes, details, subtasks..."
					@keydown.ctrl.enter.prevent="saveTask"
					@keydown.meta.enter.prevent="saveTask"></textarea>
				<div class="td-dialog-actions">
					<button
						class="td-dialog-delete"
						@click="deleteCurrentTask">
						<i class="pi pi-trash" style="font-size: 0.7rem"></i>
						Delete
					</button>
					<div class="td-dialog-right">
						<button class="td-dialog-cancel" @click="closeDialog">Cancel</button>
						<button
							class="td-dialog-save"
							:disabled="!dialogText.trim()"
							@click="saveTask">
							Save
						</button>
					</div>
				</div>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useTodosStore } from "@/stores/todos";
import Dialog from "primevue/dialog";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const { selectedDayTodos } = storeToRefs(todosStore);

// Split into active / completed
const activeTodos = computed(() =>
	selectedDayTodos.value.filter((t) => !t.completed)
);
const completedTodos = computed(() =>
	selectedDayTodos.value.filter((t) => t.completed)
);

const totalCount = computed(() => selectedDayTodos.value.length);
const completedCount = computed(() => completedTodos.value.length);

const showCompleted = ref(true);

// Progress ring
const ringCircumference = Math.round(2 * Math.PI * 15.5); // ~97
const ringOffset = computed(() => {
	if (totalCount.value === 0) return ringCircumference;
	const pct = completedCount.value / totalCount.value;
	return Math.round(ringCircumference * (1 - pct));
});
const progressStrokeColor = computed(() => {
	if (totalCount.value === 0) return 'var(--p-gray-300, #d1d5db)';
	const pct = completedCount.value / totalCount.value;
	if (pct >= 1) return 'var(--p-green-500, #22c55e)';
	if (pct >= 0.5) return 'var(--p-orange-500, #f97316)';
	return 'var(--p-orange-400, #fb923c)';
});

// ========================
// INLINE ADD
// ========================
const inlineText = ref("");
const inlineInput = ref<HTMLInputElement | null>(null);

function submitInline() {
	const text = inlineText.value.trim();
	if (!text) return;
	todosStore.addTodo(text);
	inlineText.value = "";
	// Keep focus for rapid entry
	nextTick(() => inlineInput.value?.focus());
}

function cancelInline() {
	inlineText.value = "";
	inlineInput.value?.blur();
}

// ========================
// TASK ACTIONS
// ========================
function toggleCompletion(item: any) {
	todosStore.toggleTodo(item.id);
}

// ========================
// EDIT DIALOG
// ========================
const isDialogOpen = ref(false);
const dialogText = ref("");
const dialogDescription = ref("");
const currentEditId = ref<string | null>(null);
const dialogInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);

function openEditDialog(item: any) {
	dialogText.value = item.text;
	dialogDescription.value = item.description || "";
	currentEditId.value = item.id;
	isDialogOpen.value = true;
	nextTick(() => dialogInput.value?.focus());
}

function closeDialog() {
	isDialogOpen.value = false;
	dialogText.value = "";
	dialogDescription.value = "";
	currentEditId.value = null;
}

function saveTask() {
	const text = dialogText.value.trim();
	if (!text) {
		if (currentEditId.value) todosStore.deleteTodo(currentEditId.value);
		closeDialog();
		return;
	}
	if (currentEditId.value) {
		todosStore.updateTodo(currentEditId.value, text, dialogDescription.value.trim());
	}
	closeDialog();
}

function deleteCurrentTask() {
	if (currentEditId.value) todosStore.deleteTodo(currentEditId.value);
	closeDialog();
}

function focusDescription() {
	descriptionInput.value?.focus();
}

// ========================
// LOAD
// ========================
onMounted(() => {
	todosStore.loadTodos();
});
</script>

<style scoped>
/* ====== CARD SHELL ====== */
.td-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.td-inner {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}

/* ====== TOP — title + progress ring ====== */
.td-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 0.75rem;
	flex-shrink: 0;
}
.td-title {
	font-family: 'Lora', serif;
	font-size: 1rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .td-title {
	color: var(--p-gray-200);
}

/* Progress ring */
.td-ring-wrap {
	position: relative;
	width: 2.6rem;
	height: 2.6rem;
	cursor: default;
}
.td-ring {
	width: 100%;
	height: 100%;
	display: block;
}
.td-ring-bg {
	stroke: var(--p-orange-200);
}
:where(.my-app-dark, .my-app-dark *) .td-ring-bg {
	stroke: var(--p-gray-600);
}
.td-ring-progress {
	transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.td-ring-text {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: 'Lora', serif;
	font-size: 0.6rem;
	font-weight: 700;
	color: var(--p-gray-600);
}
:where(.my-app-dark, .my-app-dark *) .td-ring-text {
	color: var(--p-gray-300);
}

/* ====== TASK LIST ====== */
.td-list {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--p-orange-200) transparent;
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
}
:where(.my-app-dark, .my-app-dark *) .td-list {
	scrollbar-color: var(--p-gray-600) transparent;
}

/* ====== TASK ITEM ====== */
.td-item {
	display: flex;
	align-items: flex-start;
	gap: 0.65rem;
	padding: 0.5rem 0.4rem;
	border-radius: 0.6rem;
	transition: background 0.15s ease;
}
.td-item:hover {
	background: color-mix(in srgb, var(--p-orange-50) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item:hover {
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
}

/* Checkbox — unchecked */
.td-check {
	flex-shrink: 0;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	border: 2px solid var(--p-orange-300);
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	margin-top: 0.15rem;
	transition: all 0.2s ease;
	padding: 0;
}
.td-check:hover {
	border-color: var(--p-green-400);
	background: color-mix(in srgb, var(--p-green-100) 30%, transparent);
}
.td-check:hover .td-check-inner {
	opacity: 1;
}
:where(.my-app-dark, .my-app-dark *) .td-check {
	border-color: var(--p-gray-500);
}
:where(.my-app-dark, .my-app-dark *) .td-check:hover {
	border-color: var(--p-green-500);
	background: color-mix(in srgb, var(--p-green-900) 25%, transparent);
}

/* Hover preview dot */
.td-check-inner {
	width: 0.35rem;
	height: 0.35rem;
	border-radius: 50%;
	background: var(--p-green-400);
	opacity: 0;
	transition: opacity 0.15s ease;
}

/* Checkbox — checked */
.td-check-done {
	border-color: var(--p-green-500);
	background: var(--p-green-500);
	color: white;
}
.td-check-done .pi-check {
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
.td-check-done:hover {
	border-color: var(--p-orange-400);
	background: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .td-check-done {
	border-color: var(--p-green-600);
	background: var(--p-green-600);
}

/* Task text */
.td-item-text {
	flex: 1;
	font-family: 'Lora', serif;
	font-size: 0.85rem;
	color: var(--p-gray-700);
	cursor: pointer;
	line-height: 1.45;
	word-break: break-word;
	transition: color 0.15s ease;
}
.td-item-text:hover {
	color: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .td-item-text {
	color: var(--p-gray-200);
}
:where(.my-app-dark, .my-app-dark *) .td-item-text:hover {
	color: var(--p-orange-400);
}

/* Completed task text */
.td-text-done {
	text-decoration: line-through;
	color: var(--p-gray-400) !important;
}
:where(.my-app-dark, .my-app-dark *) .td-text-done {
	color: var(--p-gray-500) !important;
}

/* Description icon */
.td-item-desc-icon {
	font-size: 0.7rem;
	color: var(--p-gray-300);
	margin-top: 0.25rem;
	flex-shrink: 0;
}
:where(.my-app-dark, .my-app-dark *) .td-item-desc-icon {
	color: var(--p-gray-500);
}

/* ====== INLINE ADD ====== */
.td-add-row {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.45rem 0.4rem;
	margin-top: 0.25rem;
}
.td-add-icon-wrap {
	width: 1.25rem;
	height: 1.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.td-add-icon {
	font-size: 0.7rem;
	color: var(--p-orange-400);
	transition: color 0.15s ease;
}
.td-add-row:focus-within .td-add-icon {
	color: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .td-add-icon {
	color: var(--p-orange-500);
}
.td-add-input {
	flex: 1;
	background: transparent;
	border: none;
	outline: none;
	font-family: 'Lora', serif;
	font-size: 0.85rem;
	color: var(--p-gray-700);
	padding: 0;
}
.td-add-input::placeholder {
	color: var(--p-gray-400);
	font-style: italic;
}
:where(.my-app-dark, .my-app-dark *) .td-add-input {
	color: var(--p-gray-200);
}
:where(.my-app-dark, .my-app-dark *) .td-add-input::placeholder {
	color: var(--p-gray-500);
}

/* ====== COMPLETED TOGGLE ====== */
.td-done-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.4rem;
	margin-top: 0.5rem;
	border: none;
	background: none;
	cursor: pointer;
	font-family: 'Lora', serif;
	font-size: 0.72rem;
	font-weight: 500;
	color: var(--p-gray-400);
	transition: color 0.15s ease;
	user-select: none;
}
.td-done-toggle:hover {
	color: var(--p-gray-600);
}
:where(.my-app-dark, .my-app-dark *) .td-done-toggle {
	color: var(--p-gray-500);
}
:where(.my-app-dark, .my-app-dark *) .td-done-toggle:hover {
	color: var(--p-gray-300);
}
.td-done-chevron {
	transition: transform 0.2s ease;
}

/* Completed list slide transition */
.td-completed-list {
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
}
.td-slide-enter-active,
.td-slide-leave-active {
	transition: all 0.25s ease;
	overflow: hidden;
}
.td-slide-enter-from,
.td-slide-leave-to {
	opacity: 0;
	max-height: 0;
}
.td-slide-enter-to,
.td-slide-leave-from {
	max-height: 30rem;
}

/* Done item — dimmed */
.td-item-done {
	opacity: 0.55;
}
.td-item-done:hover {
	opacity: 0.8;
}

/* ====== EMPTY STATE ====== */
.td-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2.5rem 1rem;
	text-align: center;
}
.td-empty-emoji {
	font-size: 1.5rem;
	margin-bottom: 0.35rem;
	opacity: 0.5;
}
.td-empty-text {
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	color: var(--p-gray-400);
	margin: 0;
	font-style: italic;
}
:where(.my-app-dark, .my-app-dark *) .td-empty-text {
	color: var(--p-gray-500);
}

/* ====== EDIT DIALOG ====== */
:deep(.td-dialog.p-dialog) {
	border-radius: 1.15rem !important;
	overflow: hidden;
}
:deep(.td-dialog .p-dialog-content) {
	padding: 0 !important;
}
.td-dialog-inner {
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.td-dialog-title {
	font-family: 'Lora', serif;
	font-size: 1rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-title {
	color: var(--p-gray-200);
}
.td-dialog-input {
	border: none;
	outline: none;
	background: transparent;
	font-family: 'Lora', serif;
	font-size: 1rem;
	font-weight: 600;
	color: var(--p-gray-800);
	padding: 0.4rem 0;
	border-bottom: 1px solid var(--p-orange-100);
}
.td-dialog-input::placeholder {
	color: var(--p-gray-400);
	font-weight: 400;
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-input {
	color: var(--p-gray-100);
	border-bottom-color: var(--p-gray-600);
}
.td-dialog-textarea {
	border: none;
	outline: none;
	background: color-mix(in srgb, var(--p-orange-50) 30%, transparent);
	border-radius: 0.6rem;
	font-family: 'Lora', serif;
	font-size: 0.82rem;
	color: var(--p-gray-700);
	padding: 0.6rem 0.75rem;
	min-height: 6rem;
	resize: none;
}
.td-dialog-textarea::placeholder {
	color: var(--p-gray-400);
	font-style: italic;
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-textarea {
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
	color: var(--p-gray-200);
}
.td-dialog-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 0.5rem;
	border-top: 1px solid var(--p-orange-100);
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-actions {
	border-top-color: var(--p-gray-600);
}
.td-dialog-delete {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	border: none;
	background: none;
	color: var(--p-red-400);
	font-family: 'Lora', serif;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	padding: 0.35rem 0.5rem;
	border-radius: 0.5rem;
	transition: all 0.15s ease;
}
.td-dialog-delete:hover {
	background: color-mix(in srgb, var(--p-red-100) 40%, transparent);
	color: var(--p-red-500);
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-delete:hover {
	background: color-mix(in srgb, var(--p-red-900) 30%, transparent);
}
.td-dialog-right {
	display: flex;
	gap: 0.5rem;
}
.td-dialog-cancel {
	border: none;
	background: none;
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	color: var(--p-gray-500);
	cursor: pointer;
	padding: 0.4rem 0.75rem;
	border-radius: 0.5rem;
	transition: all 0.15s ease;
}
.td-dialog-cancel:hover {
	background: var(--p-orange-50);
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-cancel:hover {
	background: var(--p-gray-700);
	color: var(--p-gray-200);
}
.td-dialog-save {
	border: none;
	background: var(--p-orange-500);
	color: white;
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	font-weight: 600;
	padding: 0.4rem 1.1rem;
	border-radius: 0.55rem;
	cursor: pointer;
	transition: all 0.2s ease;
}
.td-dialog-save:hover {
	background: var(--p-orange-600);
	transform: translateY(-1px);
}
.td-dialog-save:disabled {
	background: var(--p-gray-200);
	color: var(--p-gray-400);
	cursor: not-allowed;
	transform: none;
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-save {
	background: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .td-dialog-save:disabled {
	background: var(--p-gray-700);
	color: var(--p-gray-500);
}
</style>
