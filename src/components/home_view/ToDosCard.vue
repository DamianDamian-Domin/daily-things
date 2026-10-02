<template>
	<section
		class="todos dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="todos-title">
		<header class="todos-head">
			<div>
				<h2
					id="todos-title"
					class="today-title">
					To-do list
					<span aria-hidden="true">📝</span>
				</h2>
				<p class="todos-sub">{{ subline }}</p>
			</div>
			<div
				v-if="totalCount > 0"
				class="dt-ring"
				:class="{ 'is-complete': allDone }"
				:style="{ '--pct': ringPct }"
				role="img"
				:aria-label="`${completedCount} of ${totalCount} tasks done`">
				<span aria-hidden="true">{{ completedCount }}/{{ totalCount }}</span>
			</div>
		</header>

		<form
			class="add-row"
			@submit.prevent="submitNew">
			<label
				for="new-todo"
				class="sr-only"
				>New task</label
			>
			<span
				class="add-plus"
				aria-hidden="true"
				><i class="pi pi-plus"></i
			></span>
			<input
				id="new-todo"
				ref="newInputRef"
				v-model="newText"
				class="add-input"
				placeholder="Add a task…"
				autocomplete="off"
				enterkeyhint="done"
				@keydown.escape="newText = ''" />
			<button
				v-if="newText.trim()"
				type="submit"
				class="dt-btn dt-btn-primary dt-btn-sm">
				Add
			</button>
		</form>

		<div class="todos-scroll">
			<draggable
				v-model="activeList"
				item-key="id"
				tag="ul"
				class="todo-list"
				ghost-class="todo-ghost"
				handle=".todo-main"
				:animation="160"
				:delay="200"
				:delay-on-touch-only="true"
				:touch-start-threshold="6">
				<template #item="{ element: todo }">
					<li
						class="todo"
						:class="[todo.color ? `c-${todo.color}` : '', { expanded: expanded.has(todo.id) }]">
						<div class="todo-row">
							<button
								type="button"
								class="todo-check"
								:class="{ popping: poppingId === todo.id }"
								:aria-label="`Mark “${todo.text}” as done`"
								@click="toggle(todo)">
								<i
									class="pi pi-check"
									aria-hidden="true"></i>
							</button>
							<button
								type="button"
								class="todo-main"
								:aria-label="`Open “${todo.text}”`"
								@click="openDetails(todo)">
								<span class="todo-text">{{ todo.text }}</span>
								<span
									v-if="todo.description"
									class="todo-note-icon"
									aria-label="has notes"
									><i
										class="pi pi-align-left"
										aria-hidden="true"></i
								></span>
							</button>
							<button
								v-if="todo.subtasks?.length"
								type="button"
								class="subtask-chip"
								:class="{ complete: subDone(todo) === todo.subtasks.length }"
								:aria-expanded="expanded.has(todo.id)"
								:aria-label="`${subDone(todo)} of ${todo.subtasks.length} steps done. ${expanded.has(todo.id) ? 'Hide' : 'Show'} steps`"
								@click="toggleExpand(todo.id)">
								{{ subDone(todo) }}/{{ todo.subtasks.length }}
								<i
									class="pi pi-chevron-down"
									aria-hidden="true"></i>
							</button>
						</div>

						<Transition name="expand">
							<ul
								v-if="expanded.has(todo.id) && todo.subtasks?.length"
								class="subtasks">
								<li
									v-for="sub in todo.subtasks"
									:key="sub.id"
									class="subtask">
									<label class="subtask-label">
										<input
											type="checkbox"
											:checked="sub.done"
											@change="toggleSub(todo, sub.id)" />
										<span :class="{ done: sub.done }">{{ sub.text }}</span>
									</label>
								</li>
								<li class="subtask-add">
									<form @submit.prevent="addSubInline(todo)">
										<input
											v-model="inlineSub[todo.id]"
											class="subtask-input"
											:aria-label="`Add a step to “${todo.text}”`"
											placeholder="+ Add a step" />
									</form>
								</li>
							</ul>
						</Transition>
					</li>
				</template>
			</draggable>

			<div
				v-if="totalCount === 0"
				class="dt-empty todos-empty">
				<PixelIcon
					icon="edit_note"
					palette="indigo"
					:size="44" />
				<p>Your list is clear. Add something small you'd like to get done.</p>
			</div>
			<p
				v-else-if="activeList.length === 0"
				class="all-clear">
				🎉 All clear! Nothing left on your list.
			</p>

			<!-- Ukończone -->
			<div
				v-if="completedTodos.length > 0"
				class="done-block">
				<div class="done-head">
					<button
						type="button"
						class="done-toggle"
						:aria-expanded="showCompleted"
						@click="showCompleted = !showCompleted">
						<i
							:class="showCompleted ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
							aria-hidden="true"></i>
						{{ completedTodos.length }} completed
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						@click="clearCompleted">
						<i
							class="pi pi-trash"
							aria-hidden="true"></i>
						Clear
					</button>
				</div>
				<Transition name="expand">
					<ul
						v-if="showCompleted"
						class="todo-list">
						<li
							v-for="todo in completedTodos"
							:key="todo.id"
							class="todo is-done">
							<div class="todo-row">
								<button
									type="button"
									class="todo-check checked"
									:aria-label="`Mark “${todo.text}” as not done`"
									@click="toggle(todo)">
									<i
										class="pi pi-check"
										aria-hidden="true"></i>
								</button>
								<button
									type="button"
									class="todo-main"
									:aria-label="`Open “${todo.text}”`"
									@click="openDetails(todo)">
									<span class="todo-text">{{ todo.text }}</span>
								</button>
							</div>
						</li>
					</ul>
				</Transition>
			</div>
		</div>

		<!-- ============ SZCZEGÓŁY ZADANIA ============ -->
		<Dialog
			v-model:visible="detailsOpen"
			modal
			dismissable-mask
			:show-header="false"
			:draggable="false"
			:pt="{ root: { 'aria-labelledby': 'todo-details-title' }, mask: { class: 'dt-dialog-mask' } }"
			class="dt-dialog todo-dialog"
			@hide="saveDetails">
			<form
				v-if="editing"
				class="details"
				@submit.prevent="closeDetails">
				<div class="details-head">
					<h2
						id="todo-details-title"
						class="dt-title">
						Task details
					</h2>
					<button
						type="button"
						class="dt-icon-btn"
						aria-label="Close"
						@click="closeDetails">
						<i
							class="pi pi-times"
							aria-hidden="true"></i>
					</button>
				</div>

				<div class="dt-field">
					<label
						for="todo-title"
						class="dt-label"
						>Task</label
					>
					<input
						id="todo-title"
						ref="titleRef"
						v-model="draft.text"
						class="dt-input"
						maxlength="200" />
				</div>

				<fieldset class="dt-field subtask-editor">
					<legend class="dt-label">
						Steps
						<span
							v-if="editingSubs.length"
							class="dt-muted"
							>· {{ subDone(editing) }}/{{ editingSubs.length }}</span
						>
					</legend>
					<draggable
						v-model="editingSubs"
						item-key="id"
						tag="ul"
						class="subtask-edit-list"
						handle=".drag-handle"
						:animation="150">
						<template #item="{ element: sub }">
							<li class="subtask-edit">
								<span
									class="drag-handle"
									aria-hidden="true"
									><i class="pi pi-bars"></i
								></span>
								<input
									type="checkbox"
									:checked="sub.done"
									:aria-label="`Mark “${sub.text}” as ${sub.done ? 'not done' : 'done'}`"
									@change="toggleSub(editing!, sub.id)" />
								<input
									class="subtask-edit-input"
									:class="{ done: sub.done }"
									:value="sub.text"
									:aria-label="`Edit step “${sub.text}”`"
									@change="(e) => renameSub(sub.id, (e.target as HTMLInputElement).value)" />
								<button
									type="button"
									class="dt-icon-btn subtask-remove"
									:aria-label="`Delete step “${sub.text}”`"
									@click="removeSub(sub.id)">
									<i
										class="pi pi-times"
										aria-hidden="true"></i>
								</button>
							</li>
						</template>
					</draggable>
					<div class="subtask-new">
						<input
							v-model="newSub"
							class="dt-input"
							placeholder="Add a step and press Enter"
							aria-label="New step"
							@keydown.enter.prevent="addSubFromDialog" />
						<button
							type="button"
							class="dt-btn dt-btn-soft dt-btn-sm"
							:disabled="!newSub.trim()"
							@click="addSubFromDialog">
							Add
						</button>
					</div>
				</fieldset>

				<div class="dt-field">
					<label
						for="todo-notes"
						class="dt-label"
						>Notes</label
					>
					<textarea
						id="todo-notes"
						v-model="draft.description"
						class="dt-input notes"
						rows="3"
						placeholder="Anything worth remembering…"></textarea>
				</div>

				<fieldset class="dt-field">
					<legend class="dt-label">Color</legend>
					<div class="swatches">
						<button
							v-for="c in COLORS"
							:key="c.value"
							type="button"
							class="swatch"
							:class="`s-${c.value || 'none'}`"
							:aria-pressed="draft.color === c.value"
							:aria-label="c.label"
							@click="draft.color = c.value">
							<i
								v-if="draft.color === c.value"
								class="pi pi-check"
								aria-hidden="true"></i>
						</button>
					</div>
				</fieldset>

				<div class="details-actions">
					<button
						type="button"
						class="dt-btn dt-btn-danger dt-btn-sm"
						@click="deleteEditing">
						<i
							class="pi pi-trash"
							aria-hidden="true"></i>
						Delete
					</button>
					<button
						type="submit"
						class="dt-btn dt-btn-primary">
						Done
					</button>
				</div>
			</form>
		</Dialog>
	</section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import draggable from "vuedraggable";
import type { Subtask, TodoColor, TodoItem } from "@/libs/types";
import { useTodosStore } from "@/stores/todos";
import { useToastStore } from "@/stores/toast";
import { useSound } from "@/utils/useSound";
import { useConfetti } from "@/utils/useConfetti";
import { randomCheer } from "@/utils/useCompliment";
import PixelIcon from "@/components/ui/PixelIcon.vue";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const toast = useToastStore();
const { playCheck, playUncheck, playAdd, playVictory } = useSound();
const { launch: launchConfetti } = useConfetti();

const COLORS: Array<{ value: TodoColor; label: string }> = [
	{ value: "", label: "No color" },
	{ value: "red", label: "Red" },
	{ value: "orange", label: "Orange" },
	{ value: "yellow", label: "Yellow" },
	{ value: "green", label: "Green" },
	{ value: "blue", label: "Blue" },
	{ value: "purple", label: "Purple" },
];

// ==========================================
// LISTA
// ==========================================
const activeList = computed<TodoItem[]>({
	get: () => todosStore.activeTodos,
	set: (list) => todosStore.updateTodosOrder(list),
});
const completedTodos = computed(() => todosStore.completedTodos);
const totalCount = computed(() => todosStore.userTodosList.length);
const completedCount = computed(() => completedTodos.value.length);
const allDone = computed(() => totalCount.value > 0 && completedCount.value === totalCount.value);
const ringPct = computed(() =>
	totalCount.value ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
);
const showCompleted = ref(false);

const subline = computed(() => {
	const left = activeList.value.length;
	if (totalCount.value === 0) return "One small thing at a time.";
	if (left === 0) return "Everything's ticked off. Lovely.";
	return `${left} ${left === 1 ? "thing" : "things"} left`;
});

function subDone(todo: TodoItem) {
	return todo.subtasks?.filter((s) => s.done).length ?? 0;
}

// Konfetti, gdy lista zostaje w całości odhaczona — tylko po akcji użytkownika
let lastToggleAt = 0;
watch(allDone, (done, was) => {
	if (done && was === false && Date.now() - lastToggleAt < 2000) {
		playVictory();
		launchConfetti();
	}
});

// ==========================================
// DODAWANIE
// ==========================================
const newText = ref("");
const newInputRef = ref<HTMLInputElement | null>(null);

async function submitNew() {
	const text = newText.value.trim();
	if (!text) return;
	playAdd();
	newText.value = "";
	await todosStore.addTodo(text);
	nextTick(() => newInputRef.value?.focus());
}

// ==========================================
// ODHACZANIE
// ==========================================
const poppingId = ref<string | null>(null);

async function toggle(todo: TodoItem) {
	lastToggleAt = Date.now();
	if (!todo.completed) {
		playCheck();
		poppingId.value = todo.id;
		setTimeout(() => (poppingId.value = null), 400);
		const id = todo.id;
		await todosStore.toggleTodo(id);
		if (!allDone.value)
			toast.undoable(`Done — ${randomCheer()}`, () => todosStore.toggleTodo(id));
	} else {
		playUncheck();
		await todosStore.toggleTodo(todo.id);
	}
}

async function clearCompleted() {
	const removed = await todosStore.clearCompletedTodos();
	if (removed.length)
		toast.undoable(`Cleared ${removed.length} completed`, () => todosStore.restoreTodos(removed));
}

// ==========================================
// PODZADANIA NA LIŚCIE
// ==========================================
const expanded = reactive(new Set<string>());
const inlineSub = reactive<Record<string, string>>({});

function toggleExpand(id: string) {
	if (expanded.has(id)) expanded.delete(id);
	else expanded.add(id);
}

async function toggleSub(todo: TodoItem, subId: string) {
	const sub = todo.subtasks?.find((s) => s.id === subId);
	if (!sub) return;
	if (!sub.done) playCheck();
	else playUncheck();
	await todosStore.toggleSubtask(todo.id, subId);
	const fresh = todosStore.userTodosList.find((t) => t.id === todo.id);
	// Wszystkie kroki zrobione → proponujemy zamknięcie zadania
	if (fresh && !fresh.completed && fresh.subtasks?.length && fresh.subtasks.every((s) => s.done)) {
		toast.show("All steps done! Complete the task?", {
			tone: "celebrate",
			actionLabel: "Complete",
			action: () => toggle(fresh),
			duration: 6000,
		});
	}
}

async function addSubInline(todo: TodoItem) {
	const text = inlineSub[todo.id]?.trim();
	if (!text) return;
	inlineSub[todo.id] = "";
	playAdd();
	await todosStore.addSubtask(todo.id, text);
}

// ==========================================
// SZCZEGÓŁY
// ==========================================
const detailsOpen = ref(false);
const editingId = ref<string | null>(null);
const editing = computed(() => todosStore.userTodosList.find((t) => t.id === editingId.value) ?? null);
const draft = reactive<{ text: string; description: string; color: TodoColor }>({
	text: "",
	description: "",
	color: "",
});
const newSub = ref("");
const titleRef = ref<HTMLInputElement | null>(null);

const editingSubs = computed<Subtask[]>({
	get: () => editing.value?.subtasks ?? [],
	set: (list) => editing.value && todosStore.reorderSubtasks(editing.value.id, list),
});

function openDetails(todo: TodoItem) {
	editingId.value = todo.id;
	draft.text = todo.text;
	draft.description = todo.description ?? "";
	draft.color = todo.color ?? "";
	newSub.value = "";
	detailsOpen.value = true;
}

function closeDetails() {
	detailsOpen.value = false;
}

// Zapis przy zamknięciu okna (bez osobnego „Zapisz” — mniej klikania)
async function saveDetails() {
	const todo = editing.value;
	if (!todo) return;
	const text = draft.text.trim();
	if (!text) return; // puste — nie nadpisujemy
	const patch: Partial<TodoItem> = {};
	if (text !== todo.text) patch.text = text;
	if (draft.description.trim() !== (todo.description ?? "")) patch.description = draft.description.trim();
	if (draft.color !== (todo.color ?? "")) patch.color = draft.color;
	if (Object.keys(patch).length) await todosStore.updateTodo(todo.id, patch);
	editingId.value = null;
}

async function addSubFromDialog() {
	const text = newSub.value.trim();
	if (!text || !editing.value) return;
	newSub.value = "";
	playAdd();
	await todosStore.addSubtask(editing.value.id, text);
}

async function renameSub(subId: string, text: string) {
	if (!editing.value) return;
	if (!text.trim()) return removeSub(subId);
	await todosStore.updateSubtask(editing.value.id, subId, { text: text.trim() });
}

async function removeSub(subId: string) {
	if (!editing.value) return;
	await todosStore.deleteSubtask(editing.value.id, subId);
}

async function deleteEditing() {
	const todo = editing.value;
	if (!todo) return;
	editingId.value = null;
	detailsOpen.value = false;
	const removed = await todosStore.deleteTodo(todo.id);
	if (removed) toast.undoable(`Deleted “${removed.text}”`, () => todosStore.restoreTodo(removed));
}
</script>

<style scoped>
.todos {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}
@media (min-width: 641px) {
	.todos {
		width: 30rem;
	}
}
.todos.is-inactive {
	pointer-events: none;
	user-select: none;
}

.todos-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}
.today-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
}
.todos-sub {
	margin: 0.2rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}

.add-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.35rem 0.4rem 0.35rem 0.5rem;
	border-radius: var(--dt-radius-lg);
	border: 1.5px dashed var(--dt-border-strong);
	background: var(--dt-surface-soft);
	transition:
		border-color 0.18s ease,
		box-shadow 0.18s ease;
}
.add-row:focus-within {
	border-style: solid;
	border-color: var(--dt-accent);
	box-shadow: var(--dt-focus-ring);
}
.add-plus {
	display: grid;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	flex-shrink: 0;
}
.add-plus i {
	font-size: 0.75rem;
}
.add-input {
	flex: 1;
	min-width: 0;
	min-height: 2.3rem;
	border: none;
	background: transparent;
	font-family: var(--dt-font);
	font-size: 1rem;
	color: var(--dt-text);
	outline: none;
}
.add-input::placeholder {
	color: var(--dt-text-3);
}

.todos-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	margin: 0 -0.35rem;
	padding: 0 0.35rem 0.5rem;
	overscroll-behavior: contain;
}

.todo-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
}
.todo {
	border-radius: var(--dt-radius);
	transition: background-color 0.18s ease;
	border-left: 3px solid transparent;
}
.todo:hover {
	background: var(--dt-surface-soft);
}
.todo.expanded {
	background: var(--dt-surface-soft);
}
.todo.c-red {
	border-left-color: #e8676b;
}
.todo.c-orange {
	border-left-color: #f2994a;
}
.todo.c-yellow {
	border-left-color: #f3c64f;
}
.todo.c-green {
	border-left-color: #7cc46b;
}
.todo.c-blue {
	border-left-color: #62a8ea;
}
.todo.c-purple {
	border-left-color: #9d88e3;
}
.todo-ghost {
	opacity: 0.35;
}

.todo-row {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.2rem 0.35rem;
}
.todo-check {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	border: none;
	background: transparent;
	cursor: pointer;
	flex-shrink: 0;
	border-radius: 50%;
}
.todo-check i {
	display: grid;
	place-items: center;
	width: 1.45rem;
	height: 1.45rem;
	border-radius: 50%;
	border: 2px solid var(--dt-border-strong);
	color: transparent;
	font-size: 0.65rem;
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease,
		color 0.2s ease;
}
.todo-check:hover i {
	border-color: var(--dt-success-fill);
	color: color-mix(in srgb, var(--dt-success-fill) 60%, transparent);
}
.todo-check.checked i {
	background: var(--dt-success-fill);
	border-color: var(--dt-success-fill);
	color: #fff;
}
.todo-check.popping i {
	animation: check-pop 0.4s var(--dt-spring);
	background: var(--dt-success-fill);
	border-color: var(--dt-success-fill);
	color: #fff;
}
@keyframes check-pop {
	40% {
		transform: scale(1.35);
	}
	70% {
		transform: scale(0.9);
	}
}

.todo-main {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 0.25rem;
	border: none;
	background: transparent;
	text-align: left;
	color: var(--dt-text);
	font-family: var(--dt-font);
	font-size: var(--dt-text-md);
	cursor: pointer;
	border-radius: var(--dt-radius-sm);
}
.todo-text {
	overflow-wrap: anywhere;
	line-height: 1.35;
}
.todo-note-icon {
	color: var(--dt-text-3);
	font-size: 0.7rem;
	flex-shrink: 0;
}
.todo.is-done .todo-text {
	text-decoration: line-through;
	color: var(--dt-text-3);
}

.subtask-chip {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.3rem 0.55rem;
	min-height: 2rem;
	border-radius: var(--dt-radius-pill);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	color: var(--dt-text-2);
	font-size: var(--dt-text-xs);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	cursor: pointer;
	flex-shrink: 0;
}
.subtask-chip i {
	font-size: 0.6rem;
	transition: transform 0.2s ease;
}
.todo.expanded .subtask-chip i {
	transform: rotate(180deg);
}
.subtask-chip.complete {
	background: var(--dt-success-soft);
	border-color: transparent;
	color: var(--dt-success);
}

.subtasks {
	list-style: none;
	margin: 0;
	padding: 0 0.75rem 0.6rem 3.1rem;
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
}
.subtask-label {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	min-height: 2.2rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	cursor: pointer;
}
.subtask-label input,
.subtask-edit input[type="checkbox"] {
	width: 1.1rem;
	height: 1.1rem;
	accent-color: var(--dt-success-fill);
	flex-shrink: 0;
}
.subtask-label .done {
	text-decoration: line-through;
	color: var(--dt-text-3);
}
.subtask-input {
	width: 100%;
	min-height: 2.2rem;
	border: none;
	border-bottom: 1px dashed var(--dt-border-strong);
	background: transparent;
	font-family: var(--dt-font);
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
	outline: none;
}
.subtask-input:focus {
	border-bottom-color: var(--dt-accent);
}

.all-clear {
	margin: 0.75rem 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.todos-empty {
	padding-top: 2rem;
}
.todos-empty p {
	max-width: 18rem;
	margin: 0.25rem 0 0;
	line-height: 1.5;
}

.done-block {
	margin-top: 0.75rem;
	padding-top: 0.5rem;
	border-top: 1px solid var(--dt-border);
}
.done-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.done-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	min-height: 2.2rem;
	padding: 0.3rem 0.4rem;
	border: none;
	background: transparent;
	color: var(--dt-text-2);
	font-family: var(--dt-font);
	font-size: var(--dt-text-sm);
	font-weight: 600;
	cursor: pointer;
	border-radius: var(--dt-radius-sm);
}
.done-toggle i {
	font-size: 0.65rem;
}

/* Okno szczegółów */
.details {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.25rem;
}
.details-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.notes {
	resize: vertical;
	min-height: 4.5rem;
	line-height: 1.5;
}
.subtask-editor {
	border: none;
	margin: 0;
	padding: 0;
}
.subtask-edit-list {
	list-style: none;
	margin: 0.25rem 0 0.4rem;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}
.subtask-edit {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.1rem 0.25rem;
	border-radius: var(--dt-radius-sm);
	background: var(--dt-surface-soft);
}
.drag-handle {
	color: var(--dt-text-3);
	cursor: grab;
	padding: 0.4rem 0.2rem;
	font-size: 0.75rem;
}
.subtask-edit-input {
	flex: 1;
	min-width: 0;
	min-height: 2.2rem;
	border: none;
	background: transparent;
	font-family: var(--dt-font);
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
	outline: none;
	border-radius: var(--dt-radius-sm);
	padding: 0 0.3rem;
}
.subtask-edit-input:focus {
	box-shadow: var(--dt-focus-ring);
}
.subtask-edit-input.done {
	text-decoration: line-through;
	color: var(--dt-text-3);
}
.subtask-remove {
	width: 2rem;
	height: 2rem;
}
.subtask-remove i {
	font-size: 0.65rem;
}
.subtask-new {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}
.subtask-new .dt-input {
	flex: 1;
	min-height: 2.4rem;
}

.swatches {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-top: 0.3rem;
}
.swatch {
	display: grid;
	place-items: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	border: 2px solid var(--dt-surface);
	box-shadow: 0 0 0 1px var(--dt-border-strong);
	cursor: pointer;
	color: #fff;
	font-size: 0.7rem;
}
.swatch[aria-pressed="true"] {
	box-shadow: 0 0 0 2px var(--dt-text-2);
}
.s-none {
	background: var(--dt-surface-sunken);
	color: var(--dt-text-2);
}
.s-red {
	background: #e8676b;
}
.s-orange {
	background: #f2994a;
}
.s-yellow {
	background: #e0b43c;
}
.s-green {
	background: #6bb35b;
}
.s-blue {
	background: #5a9fe0;
}
.s-purple {
	background: #9480dc;
}

.details-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 0.25rem;
}

.expand-enter-active,
.expand-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.expand-enter-from,
.expand-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
</style>

<style>
.todo-dialog.p-dialog {
	width: min(94vw, 32rem);
	max-height: 92dvh;
}
.todo-dialog .p-dialog-content {
	overflow-y: auto;
}
</style>
