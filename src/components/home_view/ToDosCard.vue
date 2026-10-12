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

		<!-- Jedno pole: obramowanie i fokus ma cały wiersz, nie samo <input> -->
		<form
			class="add-row"
			@submit.prevent="submitNew">
			<label
				for="new-todo"
				class="add-plus">
				<i
					class="pi pi-plus"
					aria-hidden="true"></i>
				<span class="sr-only">New task</span>
			</label>
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
						class="todo dt-row"
						:class="[todo.color ? `c-${todo.color}` : '', { expanded: expanded.has(todo.id) }]">
						<div class="todo-row">
							<label class="dt-check-hit">
								<input
									type="checkbox"
									class="dt-check dt-check-round"
									:checked="todo.completed"
									:aria-label="todo.text"
									@change="onTodoCheck(todo, $event)" />
							</label>
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
									<label class="subtask-label dt-check-label">
										<input
											type="checkbox"
											class="dt-check"
											:checked="sub.done"
											@change="toggleSub(todo, sub.id)" />
										<span
											class="subtask-text"
											:class="{ done: sub.done }"
											>{{ sub.text }}</span
										>
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
							class="todo dt-row is-done">
							<div class="todo-row">
								<label class="dt-check-hit">
									<input
										type="checkbox"
										class="dt-check dt-check-round"
										:checked="todo.completed"
										:aria-label="todo.text"
										@change="toggle(todo)" />
								</label>
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
							<li class="subtask-edit dt-row">
								<span
									class="drag-handle"
									aria-hidden="true"
									><i class="pi pi-bars"></i
								></span>
								<label class="dt-check-hit">
									<input
										type="checkbox"
										class="dt-check"
										:checked="sub.done"
										:aria-label="sub.text"
										@change="toggleSub(editing!, sub.id)" />
								</label>
								<input
									class="subtask-edit-input"
									:class="{ done: sub.done }"
									:value="sub.text"
									:aria-label="`Edit step “${sub.text}”`"
									@change="(e) => renameSub(sub.id, (e.target as HTMLInputElement).value)" />
								<button
									type="button"
									class="dt-icon-btn dt-icon-btn-danger subtask-remove"
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
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
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
async function toggle(todo: TodoItem, withSound = true) {
	lastToggleAt = Date.now();
	if (!todo.completed) {
		if (withSound) playCheck();
		const id = todo.id;
		await todosStore.toggleTodo(id);
		if (!allDone.value)
			toast.undoable(`Done — ${randomCheer()}`, () => todosStore.toggleTodo(id));
	} else {
		playUncheck();
		await todosStore.toggleTodo(todo.id);
	}
}

// Po odhaczeniu zadanie zostaje chwilę na miejscu, żeby było widać „pyknięcie”
// ptaszka, i dopiero wtedy zjeżdża do ukończonych. Ponowne kliknięcie w tej
// chwili cofa decyzję.
const TICK_DELAY_MS = 320;
const pendingTicks = new Map<string, number>();

function onTodoCheck(todo: TodoItem, event: Event) {
	const input = event.target as HTMLInputElement;
	const pending = pendingTicks.get(todo.id);
	if (pending !== undefined) {
		window.clearTimeout(pending);
		pendingTicks.delete(todo.id);
		return;
	}
	if (!input.checked) return;
	lastToggleAt = Date.now();
	playCheck();
	pendingTicks.set(
		todo.id,
		window.setTimeout(() => {
			pendingTicks.delete(todo.id);
			toggle(todo, false);
		}, TICK_DELAY_MS),
	);
}

// Karta znika (np. wylogowanie) — oczekujące odhaczenia zapisujemy od razu
onBeforeUnmount(() => {
	for (const [id, timer] of pendingTicks) {
		window.clearTimeout(timer);
		const todo = todosStore.userTodosList.find((t) => t.id === id);
		if (todo && !todo.completed) todosStore.toggleTodo(id);
	}
	pendingTicks.clear();
});

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

/* Pole „Dodaj zadanie”: jedna ramka i jeden pierścień fokusu dla całego wiersza */
.add-row {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.2rem 0.3rem 0.2rem 0.2rem;
	border-radius: var(--dt-radius-lg);
	border: 1.5px dashed var(--dt-border-strong);
	background: var(--dt-surface-soft);
	transition:
		border-color var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease,
		box-shadow var(--dt-t-fast) ease;
}
.add-row:focus-within {
	border-style: solid;
	border-color: var(--dt-accent);
	background: var(--dt-surface);
	box-shadow: var(--dt-focus-ring);
}
/* „+” to etykieta pola — kliknięcie w nią ustawia kursor w polu */
.add-plus {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	flex-shrink: 0;
	border-radius: 50%;
	cursor: text;
}
.add-plus i {
	display: grid;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-size: 0.75rem;
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.add-row:focus-within .add-plus i {
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	transform: rotate(90deg);
}
.add-input {
	flex: 1;
	min-width: 0;
	min-height: 2.5rem;
	padding: 0;
	border: none;
	background: transparent;
	font-family: var(--dt-font);
	font-size: 1rem;
	color: var(--dt-text);
	outline: none;
}
/* Fokus pokazuje cały wiersz — samo pole nie dokłada drugiego obrysu */
.add-input:focus-visible {
	outline: none;
	box-shadow: none;
}
.add-input::placeholder {
	color: var(--dt-text-3);
}
@media (hover: hover) {
	.add-row:hover:not(:focus-within) {
		border-color: var(--dt-hover-border);
		background: var(--dt-hover-bg);
	}
	.add-row:hover:not(:focus-within) .add-plus i {
		background: color-mix(in srgb, var(--dt-accent) 26%, var(--dt-surface));
	}
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
	border-left: 3px solid transparent;
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
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease;
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
@media (hover: hover) {
	.subtask-chip:hover {
		border-color: var(--dt-hover-border);
		background: var(--dt-hover-bg);
		color: var(--dt-accent-ink);
	}
	.subtask-chip.complete:hover {
		border-color: color-mix(in srgb, var(--dt-success) 40%, transparent);
		background: var(--dt-success-soft);
		color: var(--dt-success);
	}
}

/* Kroki na liście — wyrównane pod tekstem zadania */
.subtasks {
	list-style: none;
	margin: 0;
	padding: 0 0.75rem 0.6rem 2.95rem;
	display: flex;
	flex-direction: column;
	gap: 0.05rem;
}
.subtask-label {
	padding: 0 0.5rem;
	border-radius: var(--dt-radius-sm);
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	transition: background-color var(--dt-t-fast) ease;
}
@media (hover: hover) {
	.subtask-label:hover {
		background: var(--dt-hover-bg);
	}
}
.subtask-text {
	line-height: 1.35;
	overflow-wrap: anywhere;
	text-decoration: line-through;
	text-decoration-color: transparent;
	transition:
		color var(--dt-t) ease,
		text-decoration-color var(--dt-t) ease;
}
.subtask-text.done {
	color: var(--dt-text-3);
	text-decoration-color: currentColor;
}
.subtask-add {
	padding: 0.15rem 0.5rem 0;
}
.subtask-input {
	width: 100%;
	min-height: 2.5rem;
	padding: 0 0.1rem;
	border: none;
	border-bottom: 1px dashed var(--dt-border-strong);
	border-radius: 0;
	background: transparent;
	font-family: var(--dt-font);
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
	outline: none;
	transition:
		border-color var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease;
}
@media (hover: hover) {
	.subtask-input:hover:not(:focus) {
		border-bottom-color: var(--dt-hover-border);
	}
}
/* Pole bez ramki — fokus to wypełniona linia i ciepłe tło, bez dodatkowej poświaty */
.subtask-input:focus-visible {
	box-shadow: none;
	border-bottom: 1.5px solid var(--dt-accent);
	background: var(--dt-hover-bg);
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
	min-height: 2.5rem;
	padding: 0.3rem 0.6rem;
	border: none;
	background: transparent;
	color: var(--dt-text-2);
	font-family: var(--dt-font);
	font-size: var(--dt-text-sm);
	font-weight: 600;
	cursor: pointer;
	border-radius: var(--dt-radius-pill);
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease;
}
.done-toggle i {
	font-size: 0.65rem;
}
@media (hover: hover) {
	.done-toggle:hover {
		background: var(--dt-hover-bg);
		color: var(--dt-accent-ink);
	}
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
	gap: 0.15rem;
	padding: 0 0.15rem 0 0.25rem;
	border-radius: var(--dt-radius-sm);
	background: var(--dt-surface-soft);
}
.drag-handle {
	color: var(--dt-text-3);
	cursor: grab;
	padding: 0.4rem 0.2rem;
	font-size: 0.75rem;
	border-radius: var(--dt-radius-sm);
	transition: color var(--dt-t-fast) ease;
}
.drag-handle:active {
	cursor: grabbing;
}
@media (hover: hover) {
	.drag-handle:hover {
		color: var(--dt-accent-ink);
	}
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
	padding: 0 0.4rem;
	transition:
		background-color var(--dt-t-fast) ease,
		box-shadow var(--dt-t-fast) ease;
}
.subtask-edit-input:focus {
	background: var(--dt-surface);
	box-shadow: var(--dt-focus-ring);
}
.subtask-edit-input.done {
	text-decoration: line-through;
	color: var(--dt-text-3);
}
.subtask-remove {
	width: 2.25rem;
	height: 2.25rem;
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
	transition:
		transform var(--dt-t) var(--dt-spring),
		box-shadow var(--dt-t-fast) ease;
}
.swatch[aria-pressed="true"] {
	box-shadow: 0 0 0 2px var(--dt-text-2);
}
.swatch:active {
	transform: scale(var(--dt-press));
}
@media (hover: hover) {
	.swatch:hover {
		transform: translateY(var(--dt-lift));
		box-shadow:
			0 0 0 1px var(--dt-hover-border),
			var(--dt-shadow-sm);
	}
	.swatch[aria-pressed="true"]:hover {
		box-shadow:
			0 0 0 2px var(--dt-text-2),
			var(--dt-shadow-sm);
	}
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
