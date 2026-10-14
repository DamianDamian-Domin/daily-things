<template>
	<div class="done-block">
		<div class="done-head">
			<button
				type="button"
				class="done-toggle"
				:aria-expanded="showCompleted"
				@click="showCompleted = !showCompleted">
				<i
					:class="showCompleted ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
					aria-hidden="true"></i>
				{{ todos.length }} completed
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
				<TodoItem
					v-for="todo in todos"
					:key="todo.id"
					:todo="todo"
					done
					@check="emit('toggle', todo)"
					@open="emit('open', todo)" />
			</ul>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { TodoItem as Todo } from "@/libs/types";
import { useTodosStore } from "@/stores/todos";
import { useToastStore } from "@/stores/toast";
import TodoItem from "./TodoItem.vue";

// Sekcja „ukończone” — zwijana lista z przyciskiem czyszczenia
defineProps<{ todos: Todo[] }>();

const emit = defineEmits<{
	toggle: [todo: Todo];
	open: [todo: Todo];
}>();

const todosStore = useTodosStore();
const toast = useToastStore();

const showCompleted = ref(false);

async function clearCompleted() {
	const removed = await todosStore.clearCompletedTodos();
	if (removed.length)
		toast.undoable(`Cleared ${removed.length} completed`, () => todosStore.restoreTodos(removed));
}
</script>

<style scoped>
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

.todo-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
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
