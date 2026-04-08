import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { nanoid } from "nanoid";

import { useAuthStore } from "./auth";
import { useHabbitsStore } from "./habbits";
import { useLoaderStore } from "./loader";
import { handleAsyncAction } from "@/stores/asyncActionHandler";

import { toDateKey } from "@/utils/timeUtils";

export interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
	description?: string; // NEW: Optional task description
	createdAt?: number; // NEW: Timestamp used for sorting (newest first)
}

export interface UserTodos {
	date: string;
	todos: TodoItem[];
}

export const useTodosStore = defineStore("todos", () => {
	const authStore = useAuthStore();
	const habbitsStore = useHabbitsStore();
	const loader = useLoaderStore();

	const { userUid } = storeToRefs(authStore);
	const { refDate } = storeToRefs(habbitsStore);

	const userTodosList = ref<UserTodos[]>([]);

	// =========================
	// SELECTED DAY TODOS (WITH SORTING)
	// =========================

	const selectedDayTodos = computed({
		get() {
			const key = toDateKey(refDate.value);
			const entry = userTodosList.value.find((item) => item.date === key);

			if (!entry) return [];

			// Sort list: unfinished first, then newest in each group
			return [...entry.todos].sort((a, b) => {
				// If both are completed or both are not completed, sort by creation date
				if (a.completed === b.completed) {
					const timeA = a.createdAt || 0;
					const timeB = b.createdAt || 0;
					return timeB - timeA; // Newest first
				}
				// Unfinished tasks (false) go before completed (true)
				return a.completed ? 1 : -1;
			});
		},
		set(newTodos) {
			const key = toDateKey(refDate.value);
			const index = userTodosList.value.findIndex((item) => item.date === key);

			if (index !== -1) {
				userTodosList.value[index].todos = newTodos;
			} else {
				userTodosList.value.push({
					date: key,
					todos: newTodos,
				});
			}
		},
	});

	// =========================
	// LOAD TODOS
	// =========================

	async function loadTodos() {
		await loader.run(async () => {
			try {
				const userDocRef = doc(db, "users", userUid.value!!);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists() && userDoc.data().todos) {
					userTodosList.value = userDoc.data().todos;
				} else {
					await setDoc(userDocRef, { todos: [] }, { merge: true });
					userTodosList.value = [];
				}
			} catch (error) {
				console.error("Error loading todos:", error);
			}
		});
	}

	// =========================
	// ADD TODO (UPDATED WITH DESCRIPTION)
	// =========================

	async function addTodo(text: string, description: string = "") {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userTodosList.value.find(
					(day) => day.date === formattedDate,
				);

				const newTodo: TodoItem = {
					id: nanoid(),
					text,
					description, // Save description
					completed: false,
					createdAt: Date.now(), // Store exact creation time in milliseconds
				};

				if (dayEntry) {
					dayEntry.todos.push(newTodo);
				} else {
					userTodosList.value.push({
						date: formattedDate,
						todos: [newTodo],
					});
				}

				const userDocRef = doc(db, "users", userUid.value!!);
				await updateDoc(userDocRef, { todos: userTodosList.value });
			},
			"Task added!",
			"Failed to add task.",
		);
	}

	// =========================
	// DELETE TODO
	// =========================

	async function deleteTodo(todoId: string) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userTodosList.value.find(
					(day) => day.date === formattedDate,
				);

				if (!dayEntry) return;

				dayEntry.todos = dayEntry.todos.filter((t) => t.id !== todoId);

				const userDocRef = doc(db, "users", userUid.value!!);
				await updateDoc(userDocRef, { todos: userTodosList.value });
			},
			"Task deleted!",
			"Failed to delete task.",
		);
	}

	// =========================
	// UPDATE TODO TEXT & DESCRIPTION
	// =========================

	async function updateTodo(
		todoId: string,
		newText: string,
		newDescription: string = "",
	) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userTodosList.value.find(
			(day) => day.date === formattedDate,
		);

		if (!dayEntry) return;

		const todo = dayEntry.todos.find((t) => t.id === todoId);
		if (!todo) return;

		todo.text = newText;
		todo.description = newDescription; // Aktualizacja opisu

		try {
			const userDocRef = doc(db, "users", userUid.value!!);
			await updateDoc(userDocRef, { todos: userTodosList.value });
		} catch (error) {
			console.error("Error updating todo:", error);
		}
	}

	// =========================
	// TOGGLE TODO COMPLETION
	// =========================

	async function toggleTodo(todoId: string) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userTodosList.value.find(
			(day) => day.date === formattedDate,
		);

		if (!dayEntry) return;

		const todo = dayEntry.todos.find((t) => t.id === todoId);
		if (!todo) return;

		todo.completed = !todo.completed;

		try {
			const userDocRef = doc(db, "users", userUid.value!!);
			await updateDoc(userDocRef, { todos: userTodosList.value });
		} catch (error) {
			todo.completed = !todo.completed;
			console.error("Error toggling todo status:", error);
		}
	}

	return {
		userTodosList,
		selectedDayTodos,
		loadTodos,
		addTodo,
		deleteTodo,
		updateTodo,
		toggleTodo,
	};
});
