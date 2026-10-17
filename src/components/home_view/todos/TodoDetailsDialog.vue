<template>
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
					{{ m.detailsTitle }}
				</h2>
				<button
					type="button"
					class="dt-icon-btn"
					:aria-label="commonMessages.close"
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
					>{{ m.task }}</label
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
					{{ m.steps }}
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
									@change="emit('toggle-sub', editing!, sub.id)" />
							</label>
							<input
								class="subtask-edit-input"
								:class="{ done: sub.done }"
								:value="sub.text"
								:aria-label="m.editStep(sub.text)"
								@change="(e) => renameSub(sub.id, (e.target as HTMLInputElement).value)" />
							<button
								type="button"
								class="dt-icon-btn dt-icon-btn-danger subtask-remove"
								:aria-label="m.deleteStep(sub.text)"
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
						:placeholder="m.newStepPlaceholder"
						:aria-label="m.newStep"
						@keydown.enter.prevent="addSubFromDialog" />
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						:disabled="!newSub.trim()"
						@click="addSubFromDialog">
						{{ m.add }}
					</button>
				</div>
			</fieldset>

			<div class="dt-field">
				<label
					for="todo-notes"
					class="dt-label"
					>{{ m.notes }}</label
				>
				<textarea
					id="todo-notes"
					v-model="draft.description"
					class="dt-input notes"
					rows="3"
					:placeholder="m.notesPlaceholder"></textarea>
			</div>

			<fieldset class="dt-field">
				<legend class="dt-label">{{ m.color }}</legend>
				<div class="swatches">
					<button
						v-for="c in COLORS"
						:key="c.value"
						type="button"
						class="swatch"
						:class="`s-${c.value || 'none'}`"
						:aria-pressed="draft.color === c.value"
						:aria-label="m.colors[c.key]"
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
					{{ commonMessages.delete }}
				</button>
				<button
					type="submit"
					class="dt-btn dt-btn-primary">
					{{ m.done }}
				</button>
			</div>
		</form>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Dialog from "primevue/dialog";
import draggable from "vuedraggable";
import type { Subtask, TodoColor, TodoItem } from "@/libs/types";
import { useTodosStore } from "@/stores/todos";
import { useToastStore } from "@/stores/toast";
import { useSound } from "@/utils/useSound";
import { subDone } from "./todoUtils";
import { todosMessages as m } from "@/i18n/messages/todos";
import { commonMessages } from "@/i18n/messages/common";

// Odhaczanie kroków obsługuje karta (dźwięk + propozycja zamknięcia zadania)
const emit = defineEmits<{
	"toggle-sub": [todo: TodoItem, subId: string];
}>();

const todosStore = useTodosStore();
const toast = useToastStore();
const { playAdd } = useSound();

// Etykieta koloru czytana w szablonie (m.colors[key]), żeby szła za językiem
type ColorKey = keyof typeof m.colors;
const COLORS: Array<{ value: TodoColor; key: ColorKey }> = [
	{ value: "", key: "none" },
	{ value: "red", key: "red" },
	{ value: "orange", key: "orange" },
	{ value: "yellow", key: "yellow" },
	{ value: "green", key: "green" },
	{ value: "blue", key: "blue" },
	{ value: "purple", key: "purple" },
];

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

function open(todo: TodoItem) {
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
	if (removed) toast.undoable(m.deleted(removed.text), () => todosStore.restoreTodo(removed));
}

defineExpose({ open });
</script>

<style scoped>
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
