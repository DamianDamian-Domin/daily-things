<template>
	<div
		class="td-card card-a sm:w-[480px] surface-content w-full h-full min-h-[30rem] sm:max-h-[50rem]">
		<div
			class="td-inner"
			:class="!isActive && 'pointer-events-none'">
			<!-- Header with progress ring -->
			<div class="td-top">
				<h3 class="td-title">To-do list 📝</h3>
				<div
					class="td-ring"
					:style="ringStyle"
					v-tooltip.bottom="completedCount + '/' + totalCount + ' done'">
					<div class="td-ring-inner">
						<span class="td-ring-text"
							>{{ completedCount }}/{{ totalCount }}</span
						>
					</div>
				</div>
			</div>

			<!-- Task list -->
			<div class="td-list">
				<!-- Active tasks -->
				<draggable
					v-model="activeTodos"
					item-key="id"
					ghost-class="opacity-40"
					:animation="150"
					@end="handleDragEnd">
					<template #item="{ element: item }">
						<div class="td-item cursor-grab active:cursor-grabbing">
							<button
								:class="[
									'td-check',
									{ 'td-check-bounce': bouncingCheckId === item.id },
								]"
								@click="toggleCompletion(item)">
								<i class="pi pi-check td-check-inner"></i>
							</button>
							<span
								class="td-item-label"
								:class="item.color ? 'td-item--' + item.color : ''">
								<span
									class="td-item-text"
									@click="openEditDialog(item)">
									{{ item.text }}
								</span>
								<i
									v-if="item.description"
									v-tooltip.top="'This task has an additional description'"
									class="pi pi-align-left td-item-desc-icon">
								</i>
							</span>
						</div>
					</template>
				</draggable>

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

				<template v-if="completedTodos.length > 0">
					<div class="td-done-row">
						<button
							class="td-done-toggle"
							@click="showCompleted = !showCompleted">
							<i
								class="pi td-done-chevron"
								:class="showCompleted ? 'pi-chevron-down' : 'pi-chevron-right'"
								style="font-size: 0.6rem"></i>
							<span>{{ completedTodos.length }} completed</span>
						</button>
						<div
							class="flex items-center"
							ref="confirmContainerRef">
							<button
								v-if="!isConfirmingDelete"
								class="td-clear-pill"
								@click="openConfirm">
								<i
									class="pi pi-trash"
									style="font-size: 0.6rem"></i>
								<span>Clear</span>
							</button>

							<div
								v-else
								class="flex items-center gap-2 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20">
								<span
									class="text-[0.7rem] text-red-600 dark:text-red-400 font-medium ml-1 uppercase tracking-wide">
									Sure?
								</span>

								<button
									@click="executeDeleteAll"
									class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors flex items-center justify-center">
									<i
										class="pi pi-check"
										style="font-size: 0.65rem"></i>
								</button>

								<button
									@click="closeConfirm"
									class="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors flex items-center justify-center">
									<i
										class="pi pi-times"
										style="font-size: 0.65rem"></i>
								</button>
							</div>
						</div>
					</div>

					<Transition name="td-slide">
						<div
							v-if="showCompleted"
							class="td-completed-list">
							<div
								v-for="item in completedTodos"
								:key="item.id"
								class="td-item td-item-done">
								<button
									class="td-check td-check-done"
									@click="toggleCompletion(item)">
									<i
										class="pi pi-check"
										style="font-size: 0.55rem"></i>
								</button>

								<span
									class="td-item-text td-text-done line-through"
									@click="openEditDialog(item)">
									{{ item.text }}
								</span>

								<i
									v-if="item.description"
									v-tooltip.top="'This task has an additional description'"
									class="pi pi-align-left td-item-desc-icon">
								</i>
							</div>
						</div>
					</Transition>
				</template>

				<!-- Empty state -->
				<div
					v-if="totalCount === 0"
					class="td-empty">
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
				<!-- Color picker -->
				<div class="td-color-picker">
					<button
						v-for="c in todoColors"
						:key="c.value"
						class="td-color-swatch"
						:class="[
							`td-swatch--${c.value || 'none'}`,
							dialogColor === c.value && 'td-swatch--active',
						]"
						v-tooltip.top="c.label"
						@click="dialogColor = c.value">
						<i
							v-if="dialogColor === c.value"
							class="pi pi-check"
							style="font-size: 0.5rem"></i>
					</button>
				</div>
				<div class="td-dialog-actions">
					<button
						class="td-dialog-delete"
						@click="deleteCurrentTask">
						<i
							class="pi pi-trash"
							style="font-size: 0.7rem"></i>
						Delete
					</button>
					<div class="td-dialog-right">
						<button
							class="td-dialog-cancel"
							@click="closeDialog">
							Cancel
						</button>
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
import {
	ref,
	computed,
	onMounted,
	nextTick,
	watch,
	onBeforeUnmount,
} from "vue";
import { storeToRefs } from "pinia";
import { useTodosStore } from "@/stores/todos";
import { useSound } from "@/utils/useSound";
import { useConfetti } from "@/utils/useConfetti";
import { useCompliment } from "@/utils/useCompliment";
import { usePreferencesStore } from "@/stores/userPreferences"; // <-- Dodany import preferencji
import Dialog from "primevue/dialog";
import draggable from "vuedraggable";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const preferencesStore = usePreferencesStore(); // <-- Inicjalizacja store'a preferencji

// Pobieramy posortowane zadania ze sklepu (store)
const { sortedTodos } = storeToRefs(todosStore);

// ========================
// DRAG & DROP COMPUTEDS
// ========================
// Najpierw filtrujemy ukończone zadania (zostają na dole, tylko odczyt)
const completedTodos = computed(() =>
	sortedTodos.value.filter((t) => t.completed),
);

const activeTodos = computed({
	get() {
		return sortedTodos.value.filter((t) => !t.completed);
	},
	set(newValue) {
		// Łączymy nową ułożoną tablicę aktywnych zadań z ukończonymi
		const newOrder = [...newValue, ...completedTodos.value];

		// Przekazujemy połączoną listę do naszej nowej akcji w storze!
		todosStore.updateTodosOrder(newOrder);
	},
});

// Funkcja wywoływana, gdy użytkownik puści element (zdarzenie @end)
const handleDragEnd = () => {
	// Jeśli w swoim useTodosStore masz funkcję, która zapisuje nową kolejność
	// do bazy danych (np. Firebase), możesz ją tu wywołać, np:
	// todosStore.updateOrderInDatabase();
	console.log("Drag & Drop zakończony, nowa kolejność w pamięci!");
};

// ========================
// COUNTERS & UI
// ========================
const totalCount = computed(() => sortedTodos.value.length);
const completedCount = computed(() => completedTodos.value.length);
const showCompleted = ref(true);

// Progress ring — CSS conic-gradient
const ringStyle = computed(() => {
	const pct =
		totalCount.value === 0
			? 0
			: (completedCount.value / totalCount.value) * 100;
	let color: string;
	if (totalCount.value === 0) color = "var(--p-gray-300, #d1d5db)";
	else if (pct >= 100) color = "var(--p-green-500, #22c55e)";
	else if (pct >= 50) color = "var(--p-orange-500, #f97316)";
	else color = "var(--p-orange-400, #fb923c)";
	return {
		"--ring-pct": pct,
		"--ring-color": color,
	};
});

const { playCheck, playUncheck, playAdd, playVictory } = useSound();
const { launch: launchConfetti } = useConfetti();
const { show: showCompliment } = useCompliment();
const bouncingCheckId = ref<string | null>(null);

// Obserwujemy ukończenie wszystkich zadań — odpalamy fanfarę i konfetti
let todosCelebrated = false;
watch(completedCount, (val) => {
	if (val > 0 && val === totalCount.value) {
		if (!todosCelebrated) {
			todosCelebrated = true;
			playVictory();
			launchConfetti();
		}
	} else {
		todosCelebrated = false;
	}
});

// ========================
// INLINE ADD
// ========================
const inlineText = ref("");
const inlineInput = ref<HTMLInputElement | null>(null);

function submitInline() {
	const text = inlineText.value.trim();
	if (!text) return;
	playAdd();
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
	if (!item.completed) {
		playCheck();
		showCompliment();

		// Uruchamiamy animację ikonki TYLKO, gdy animacje są włączone
		if (preferencesStore.animationsEnabled) {
			bouncingCheckId.value = item.id;
			setTimeout(() => {
				bouncingCheckId.value = null;
			}, 400);
		}
	} else {
		playUncheck();
	}
	todosStore.toggleTodo(item.id);
}

// ========================
// EDIT DIALOG
// ========================
const isDialogOpen = ref(false);
const dialogText = ref("");
const dialogDescription = ref("");
const dialogColor = ref<import("@/stores/todos").TodoColor>("");
const currentEditId = ref<string | null>(null);
const dialogInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);

const todoColors: {
	value: import("@/stores/todos").TodoColor;
	label: string;
}[] = [
	{ value: "", label: "None" },
	{ value: "red", label: "Red" },
	{ value: "orange", label: "Orange" },
	{ value: "yellow", label: "Yellow" },
	{ value: "green", label: "Green" },
	{ value: "blue", label: "Blue" },
	{ value: "purple", label: "Purple" },
];

function openEditDialog(item: any) {
	dialogText.value = item.text;
	dialogDescription.value = item.description || "";
	dialogColor.value = item.color || "";
	currentEditId.value = item.id;
	isDialogOpen.value = true;
	nextTick(() => dialogInput.value?.focus());
}

function closeDialog() {
	isDialogOpen.value = false;
	dialogText.value = "";
	dialogDescription.value = "";
	dialogColor.value = "";
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
		todosStore.updateTodo(
			currentEditId.value,
			text,
			dialogDescription.value.trim(),
		);
		todosStore.updateTodoColor(currentEditId.value, dialogColor.value);
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
// INLINE CONFIRM DELETE ALL
// ========================
const isConfirmingDelete = ref(false);
const confirmContainerRef = ref<HTMLElement | null>(null);

function openConfirm() {
	isConfirmingDelete.value = true;
	nextTick(() => {
		document.addEventListener("mousedown", handleClickOutside);
	});
}

function closeConfirm() {
	isConfirmingDelete.value = false;
	document.removeEventListener("mousedown", handleClickOutside);
}

function handleClickOutside(event: MouseEvent) {
	if (
		confirmContainerRef.value &&
		!confirmContainerRef.value.contains(event.target as Node)
	) {
		closeConfirm();
	}
}

function executeDeleteAll() {
	// Wywołujemy prawdziwą funkcję czyszczącą:
	todosStore.clearCompletedTodos();
	// Zamykamy tryb potwierdzania i sprzątamy event listener:
	closeConfirm();
}

onBeforeUnmount(() => {
	document.removeEventListener("mousedown", handleClickOutside);
});

// ========================
// LOAD
// ========================
onMounted(() => {
	todosStore.loadTodos();
});
</script>
<style scoped>
/* Bounce animacja kółka przy zaznaczaniu */
@keyframes td-check-pop {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(1.45);
	}
	70% {
		transform: scale(0.88);
	}
	100% {
		transform: scale(1);
	}
}
.td-check-bounce {
	animation: td-check-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
	transition: none !important;
}

/* ====== CARD SHELL ====== */
.td-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid var(--p-gray-200);
}

:where(.my-app-dark, .my-app-dark *) .td-card {
	border: 1px solid var(--p-gray-800);
}
.td-inner {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}
@media (max-width: 640px) {
	.td-card {
		height: auto !important;
		max-height: none !important;
		overflow: visible;
	}
	.td-inner {
		overflow: visible;
		min-height: unset;
	}
	.td-list {
		overflow-y: visible;
		min-height: unset;
	}
}

.td-check-done i {
	transform: translateY(1px);
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
	font-family: "Lora", serif;
	font-size: 1rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .td-title {
	color: var(--p-gray-200);
}

/* Progress ring — conic-gradient */
@property --ring-pct {
	syntax: "<number>";
	inherits: false;
	initial-value: 0;
}
.td-ring {
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 50%;
	flex-shrink: 0;
	cursor: default;
	position: relative;
	background: conic-gradient(
		var(--ring-color, var(--p-orange-400)) calc(var(--ring-pct) * 1%),
		var(--p-orange-200, #fed7aa) calc(var(--ring-pct) * 1%)
	);
	transition:
		--ring-pct 0.5s ease,
		--ring-color 0.4s ease;
}
.td-ring-inner {
	position: absolute;
	inset: 3.5px;
	border-radius: 50%;
	background: var(--p-surface-0, white);
	display: flex;
	align-items: center;
	justify-content: center;
}
:where(.my-app-dark, .my-app-dark *) .td-ring-inner {
	background: var(--p-gray-800, #1f2937);
}
.td-ring-text {
	font-family: "Lora", serif;
	font-size: 0.58rem;
	font-weight: 700;
	color: var(--p-gray-600);
	line-height: 1;
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
@media (max-width: 640px) {
	.td-list {
		overflow-y: visible;
		min-height: unset;
	}
}
:where(.my-app-dark, .my-app-dark *) .td-list {
	scrollbar-color: var(--p-gray-600) transparent;
}

/* ====== TASK ITEM ====== */
.td-item {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.5rem 0.55rem;
	border-radius: 0.85rem;
	border: 1px solid transparent;
	transition: background 0.15s ease;
}

/* Colored label wrapper (text + desc icon only) */
.td-item-label {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	flex: 1;
	min-width: 0;
	border-radius: 0.6rem;
	padding: 0.15rem 0.5rem;
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
	transition: all 0.2s ease;
	padding: 0;
}
.td-check:hover {
	border-color: var(--p-orange-400);
	background: color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-orange-300) 25%, transparent);
	transform: scale(1.1);
}
.td-check:hover .td-check-inner {
	opacity: 1;
	transform: scale(1);
}
:where(.my-app-dark, .my-app-dark *) .td-check {
	border-color: var(--p-gray-500);
}
:where(.my-app-dark, .my-app-dark *) .td-check:hover {
	border-color: var(--p-orange-400);
	background: color-mix(in srgb, var(--p-orange-900) 30%, transparent);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-orange-500) 20%, transparent);
	transform: scale(1.1);
}

/* Hover preview check icon */
.td-check-inner {
	font-size: 0.55rem;
	color: var(--p-orange-400);
	opacity: 0;
	transform: scale(0);
	transition:
		opacity 0.15s ease,
		transform 0.15s ease;
}

/* Checkbox — checked */
.td-check-done {
	border-color: var(--p-green-500);
	background: var(--p-green-500);
	color: white;
}
:where(.my-app-dark, .my-app-dark *) .td-check-done {
	border-color: var(--p-green-600);
	background: var(--p-green-600);
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
	border-color: var(--p-green-600);
	background: var(--p-green-600);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-green-400) 25%, transparent);
	transform: scale(1.1);
}
:where(.my-app-dark, .my-app-dark *) .td-check-done {
	border-color: var(--p-green-600);
	background: var(--p-green-600);
}

/* Task text */
.td-item-text {
	flex: 1;
	font-family: "Lora", serif;
	font-size: 0.85rem;
	color: var(--p-gray-700);
	cursor: pointer;
	line-height: 1.45;
	word-break: break-word;
	transition: color 0.15s ease;
}
:where(.my-app-dark, .my-app-dark *) .td-item-text {
	color: var(--p-gray-200);
}

/* Completed task text */
.td-text-done {
	text-decoration: line-through;
	color: var(--p-gray-700) !important;
}
:where(.my-app-dark, .my-app-dark *) .td-text-done {
	color: var(--p-gray-200);
}

/* Description icon */
.td-item-desc-icon {
	font-size: 0.7rem;
	color: var(--p-gray-300);
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
	font-family: "Lora", serif;
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

/* ====== COMPLETED TOGGLE ROW ====== */
.td-done-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 0.5rem;
}

.td-clear-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.25rem 0.65rem;
	border: none;
	border-radius: 999px;
	background: color-mix(in srgb, var(--p-red-100) 60%, transparent);
	color: var(--p-red-400);
	font-family: "Lora", serif;
	font-size: 0.68rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s ease,
		color 0.15s ease;
	user-select: none;
}
.td-clear-pill:hover {
	background: var(--p-red-100);
	color: var(--p-red-500);
}
:where(.my-app-dark, .my-app-dark *) .td-clear-pill {
	background: color-mix(in srgb, var(--p-red-900) 40%, transparent);
	color: var(--p-red-400);
}
:where(.my-app-dark, .my-app-dark *) .td-clear-pill:hover {
	background: color-mix(in srgb, var(--p-red-900) 70%, transparent);
	color: var(--p-red-300);
}

.td-done-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.4rem;
	border: none;
	background: none;
	cursor: pointer;
	font-family: "Lora", serif;
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
	padding: 0.6rem;
	border-radius: 0.85rem;
	margin-top: 0.4rem;

	/* Idealnie skopiowane tło i ramka z Goals */
	background: color-mix(in srgb, var(--p-orange-50) 40%, transparent);
	border: 1px solid color-mix(in srgb, var(--p-orange-100) 50%, transparent);
}

/* Tryb ciemny dla kontenera (Dark Mode) */
:where(.my-app-dark, .my-app-dark *) .td-completed-list {
	background: color-mix(in srgb, var(--p-gray-700) 30%, transparent);
	border-color: color-mix(in srgb, var(--p-gray-600) 30%, transparent);
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
	background: transparent;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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
	font-family: "Lora", serif;
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

/* ====== COLOR PICKER ====== */
.td-color-picker {
	display: flex;
	gap: 0.45rem;
	align-items: center;
	flex-wrap: wrap;
}
.td-color-swatch {
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	border: 2px solid transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		transform 0.15s ease,
		border-color 0.15s ease;
	color: white;
}
.td-color-swatch:hover {
	transform: scale(1.15);
}
.td-swatch--none {
	background: var(--p-gray-200);
	border-color: var(--p-gray-300);
	color: var(--p-gray-500);
}
.td-swatch--none.td-swatch--active {
	border-color: var(--p-gray-400);
}
.td-swatch--red {
	background: var(--p-red-400);
}
.td-swatch--orange {
	background: var(--p-orange-400);
}
.td-swatch--yellow {
	background: var(--p-yellow-400);
}
.td-swatch--green {
	background: var(--p-green-400);
}
.td-swatch--blue {
	background: var(--p-blue-400);
}
.td-swatch--purple {
	background: var(--p-purple-400);
}
.td-swatch--active {
	border-color: white;
	box-shadow: 0 0 0 2px currentColor;
}
.td-swatch--red.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-red-400);
}
.td-swatch--orange.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-orange-400);
}
.td-swatch--yellow.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-yellow-400);
}
.td-swatch--green.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-green-400);
}
.td-swatch--blue.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-blue-400);
}
.td-swatch--purple.td-swatch--active {
	box-shadow: 0 0 0 2px var(--p-purple-400);
}

:where(.my-app-dark, .my-app-dark *) .td-swatch--none {
	background: var(--p-gray-600);
	border-color: var(--p-gray-500);
}

/* ====== COLORED TODO ITEMS ====== */
.td-item--red {
	background: color-mix(in srgb, var(--p-red-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-red-200) 70%, transparent);
}
.td-item--orange {
	background: color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-orange-200) 70%, transparent);
}
.td-item--yellow {
	background: color-mix(in srgb, var(--p-yellow-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-yellow-200) 70%, transparent);
}
.td-item--green {
	background: color-mix(in srgb, var(--p-green-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-green-200) 70%, transparent);
}
.td-item--blue {
	background: color-mix(in srgb, var(--p-blue-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-blue-200) 70%, transparent);
}
.td-item--purple {
	background: color-mix(in srgb, var(--p-purple-100) 60%, transparent);
	border-color: color-mix(in srgb, var(--p-purple-200) 70%, transparent);
}

:where(.my-app-dark, .my-app-dark *) .td-item--red {
	background: color-mix(in srgb, var(--p-red-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-red-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item--orange {
	background: color-mix(in srgb, var(--p-orange-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-orange-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item--yellow {
	background: color-mix(in srgb, var(--p-yellow-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-yellow-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item--green {
	background: color-mix(in srgb, var(--p-green-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-green-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item--blue {
	background: color-mix(in srgb, var(--p-blue-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-blue-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .td-item--purple {
	background: color-mix(in srgb, var(--p-purple-900) 40%, transparent);
	border-color: color-mix(in srgb, var(--p-purple-700) 50%, transparent);
}
</style>
