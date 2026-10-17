import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import type { Subtask, TodoItem } from "@/libs/types";
import { useAuthStore } from "@/stores/auth";
import { plain } from "@/utils/plain";
import { useToastStore } from "@/stores/toast";
import {
	deleteTodos,
	fetchTodos,
	migrateLegacyTodos,
	normalizeLegacyTodos,
	saveTodos,
	type UserDoc,
} from "@/services/userData";
import { todosMessages as m } from "@/i18n/messages/todos";

export type { TodoColor, TodoItem, Subtask } from "@/libs/types";

export const useTodosStore = defineStore("todos", () => {
	const authStore = useAuthStore();
	const toast = useToastStore();

	// Każde zadanie to osobny dokument: users/{uid}/todos/{id}
	const userTodosList = ref<TodoItem[]>([]);

	function sortValue(todo: TodoItem) {
		return todo.order ?? todo.createdAt ?? 0;
	}

	const activeTodos = computed(() =>
		userTodosList.value.filter((t) => !t.completed).sort((a, b) => sortValue(a) - sortValue(b)),
	);

	// Ukończone — najświeższe na górze
	const completedTodos = computed(() =>
		userTodosList.value
			.filter((t) => t.completed)
			.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
	);

	const sortedTodos = computed(() => [...activeTodos.value, ...completedTodos.value]);

	async function load(uid: string, userDoc: UserDoc) {
		const legacy = normalizeLegacyTodos(userDoc.todos);
		let todos: TodoItem[];
		try {
			todos = await fetchTodos(uid);
		} catch (err) {
			// Bez listy zadań reszta aplikacji (nawyki, znajomi) i tak ma działać,
			// np. gdy reguły Firestore jeszcze nie znają kolekcji todos.
			// Pokazujemy starą tablicę i nie migrujemy — spróbujemy przy kolejnym wczytaniu.
			console.error("Loading todos failed", err);
			if (authStore.userUid === uid) userTodosList.value = legacy;
			return;
		}
		if (legacy.length > 0 || Array.isArray(userDoc.todos)) {
			// Stara tablica w dokumencie użytkownika → osobne dokumenty.
			// W tle: offline zapis czeka na sieć, a lista działa od razu.
			const ids = new Set(todos.map((t) => t.id));
			const missing = legacy.filter((t) => !ids.has(t.id));
			todos.push(...missing);
			migrateLegacyTodos(uid, missing).catch((err) =>
				console.warn("Legacy todos migration failed, will retry next load", err),
			);
		}
		if (authStore.userUid === uid) userTodosList.value = todos;
	}

	// Stan lokalny zmienia się od razu, a do Firestore lecą tylko zmienione
	// zadania (lub usunięte id). Przy błędzie przywracamy poprzedni stan.
	function commit(mutate: () => void) {
		const uid = authStore.userUid;
		if (!uid) return false;
		const previous = plain(userTodosList.value);
		const before = new Map(previous.map((t) => [t.id, JSON.stringify(t)]));
		mutate();
		const current = new Map(userTodosList.value.map((t) => [t.id, t]));
		const changed = [...current.values()]
			.filter((t) => before.get(t.id) !== JSON.stringify(t))
			.map((t) => plain(t));
		const removed = [...before.keys()].filter((id) => !current.has(id));
		if (changed.length === 0 && removed.length === 0) return true;
		Promise.all([
			changed.length ? saveTodos(uid, changed) : null,
			removed.length ? deleteTodos(uid, removed) : null,
		]).catch((err) => {
			console.error("todos save failed", err);
			if (authStore.userUid === uid) userTodosList.value = previous;
			toast.error(m.saveError);
		});
		return true;
	}

	function find(id: string) {
		return userTodosList.value.find((t) => t.id === id);
	}

	async function addTodo(text: string) {
		const trimmed = text.trim();
		if (!trimmed) return null;
		const maxOrder = activeTodos.value.reduce((max, t) => Math.max(max, t.order ?? -1), -1);
		const todo: TodoItem = {
			id: nanoid(),
			text: trimmed,
			completed: false,
			createdAt: Date.now(),
			order: maxOrder + 1,
			subtasks: [],
		};
		commit(() => userTodosList.value.push(todo));
		return todo;
	}

	async function updateTodo(id: string, patch: Partial<Omit<TodoItem, "id">>) {
		commit(() => {
			const todo = find(id);
			if (todo) Object.assign(todo, patch);
		});
	}

	async function toggleTodo(id: string) {
		commit(() => {
			const todo = find(id);
			if (!todo) return;
			todo.completed = !todo.completed;
			todo.completedAt = todo.completed ? Date.now() : undefined;
			if (!todo.completed) {
				todo.order = activeTodos.value.reduce((max, t) => Math.max(max, t.order ?? -1), -1) + 1;
			}
		});
	}

	async function deleteTodo(id: string) {
		const removed = find(id);
		if (!removed) return null;
		const copy = plain(removed);
		commit(() => {
			userTodosList.value = userTodosList.value.filter((t) => t.id !== id);
		});
		return copy;
	}

	async function restoreTodo(todo: TodoItem) {
		commit(() => {
			if (!find(todo.id)) userTodosList.value.push(todo);
		});
	}

	async function updateTodosOrder(ordered: TodoItem[]) {
		commit(() => {
			ordered.forEach((todo, index) => {
				const t = find(todo.id);
				if (t) t.order = index;
			});
		});
	}

	async function clearCompletedTodos() {
		const removed = completedTodos.value.map((t) => plain(t));
		commit(() => {
			userTodosList.value = userTodosList.value.filter((t) => !t.completed);
		});
		return removed;
	}

	async function restoreTodos(todos: TodoItem[]) {
		commit(() => {
			const ids = new Set(userTodosList.value.map((t) => t.id));
			userTodosList.value.push(...todos.filter((t) => !ids.has(t.id)));
		});
	}

	// ==========================================
	// PODZADANIA
	// ==========================================
	async function addSubtask(todoId: string, text: string) {
		const trimmed = text.trim();
		if (!trimmed) return;
		commit(() => {
			const todo = find(todoId);
			if (!todo) return;
			todo.subtasks = [...(todo.subtasks ?? []), { id: nanoid(8), text: trimmed, done: false }];
		});
	}

	async function updateSubtask(todoId: string, subtaskId: string, patch: Partial<Subtask>) {
		commit(() => {
			const sub = find(todoId)?.subtasks?.find((s) => s.id === subtaskId);
			if (sub) Object.assign(sub, patch);
		});
	}

	async function toggleSubtask(todoId: string, subtaskId: string) {
		const sub = find(todoId)?.subtasks?.find((s) => s.id === subtaskId);
		if (!sub) return;
		await updateSubtask(todoId, subtaskId, { done: !sub.done });
	}

	async function deleteSubtask(todoId: string, subtaskId: string) {
		commit(() => {
			const todo = find(todoId);
			if (todo) todo.subtasks = (todo.subtasks ?? []).filter((s) => s.id !== subtaskId);
		});
	}

	async function reorderSubtasks(todoId: string, subtasks: Subtask[]) {
		commit(() => {
			const todo = find(todoId);
			if (todo) todo.subtasks = plain(subtasks);
		});
	}

	function clearData() {
		userTodosList.value = [];
	}

	return {
		userTodosList,
		activeTodos,
		completedTodos,
		sortedTodos,
		load,
		addTodo,
		updateTodo,
		toggleTodo,
		deleteTodo,
		restoreTodo,
		updateTodosOrder,
		clearCompletedTodos,
		restoreTodos,
		addSubtask,
		updateSubtask,
		toggleSubtask,
		deleteSubtask,
		reorderSubtasks,
		clearData,
	};
});
