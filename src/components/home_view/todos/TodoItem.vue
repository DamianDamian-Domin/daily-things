<template>
	<li
		class="todo dt-row"
		:class="done ? 'is-done' : [todo.color ? `c-${todo.color}` : '', { expanded }]">
		<div class="todo-row">
			<label class="dt-check-hit">
				<input
					type="checkbox"
					class="dt-check dt-check-round"
					:checked="todo.completed"
					:aria-label="todo.text"
					@change="emit('check', $event)" />
			</label>
			<button
				type="button"
				class="todo-main"
				:aria-label="m.open(todo.text)"
				@click="emit('open')">
				<span class="todo-text">{{ todo.text }}</span>
				<span
					v-if="!done && todo.description"
					class="todo-note-icon"
					:aria-label="m.hasNotes"
					><i
						class="pi pi-align-left"
						aria-hidden="true"></i
				></span>
			</button>
			<button
				v-if="!done && todo.subtasks?.length"
				type="button"
				class="subtask-chip"
				:class="{ complete: subDone(todo) === todo.subtasks.length }"
				:aria-expanded="expanded"
				:aria-label="m.stepsChip(subDone(todo), todo.subtasks.length, expanded)"
				@click="emit('toggle-expand')">
				{{ subDone(todo) }}/{{ todo.subtasks.length }}
				<i
					class="pi pi-chevron-down"
					aria-hidden="true"></i>
			</button>
		</div>

		<Transition
			v-if="!done"
			name="expand">
			<ul
				v-if="expanded && todo.subtasks?.length"
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
							@change="emit('toggle-sub', sub.id)" />
						<span
							class="subtask-text"
							:class="{ done: sub.done }"
							>{{ sub.text }}</span
						>
					</label>
				</li>
				<li class="subtask-add">
					<form @submit.prevent="emit('add-sub')">
						<input
							v-model="newStep"
							class="subtask-input"
							:aria-label="m.addStepTo(todo.text)"
							:placeholder="m.addStepPlaceholder" />
					</form>
				</li>
			</ul>
		</Transition>
	</li>
</template>

<script setup lang="ts">
import type { TodoItem } from "@/libs/types";
import { subDone } from "./todoUtils";
import { todosMessages as m } from "@/i18n/messages/todos";

// Jeden wiersz zadania; `done` = wariant uproszczony dla sekcji „ukończone”
withDefaults(defineProps<{ todo: TodoItem; done?: boolean; expanded?: boolean }>(), {
	done: false,
	expanded: false,
});

// Treść pola „+ Add a step” trzyma rodzic (per zadanie)
const newStep = defineModel<string | undefined>("newStep");

const emit = defineEmits<{
	check: [event: Event];
	open: [];
	"toggle-expand": [];
	"toggle-sub": [subId: string];
	"add-sub": [];
}>();
</script>

<style scoped>
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
/* Klasę nadaje vuedraggable przeciąganemu elementowi */
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
