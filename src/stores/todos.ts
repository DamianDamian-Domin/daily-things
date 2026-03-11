import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
	setDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { nanoid } from "nanoid";

import { useAuthStore } from "./auth";
import { useHabbitsStore } from "./habbits";
import { useLoaderStore } from "./loader";

import { toDateKey } from "@/utils/timeUtils";
import { handleAsyncAction } from "@/stores/asyncActionHandler";

export interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
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

	// TODOS FOR SELECTED DAY
	const selectedDayTodos = computed({
		get() {
			const key = toDateKey(refDate.value);
			const entry = userTodosList.value.find((item) => item.date === key);
			return entry ? entry.todos : [];
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

	// LOAD TODOS
	async function loadTodosForDate(selectedDate: Date) {
		await loader.run(async () => {
			try {
				const todosRef = collection(db, "users", userUid.value!!, "todos");

				const q = query(todosRef, where("date", "==", toDateKey(selectedDate)));

				const querySnapshot = await getDocs(q);

				querySnapshot.forEach((docSnap) => {
					const { date, todos } = docSnap.data();

					const alreadyExists = userTodosList.value.some(
						(entry) => entry.date === date,
					);

					if (!alreadyExists) {
						userTodosList.value.push({ date, todos });
					}
				});
			} catch (error) {
				console.error("Error loading todos:", error);
			}
		});
	}

	// ADD TODO
	async function addTodo(text: string) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);

				const dayEntry = userTodosList.value.find(
					(day) => day.date === formattedDate,
				);

				const newTodo: TodoItem = {
					id: nanoid(),
					text,
					completed: true,
				};

				const todosRef = doc(
					db,
					"users",
					userUid.value!!,
					"todos",
					formattedDate,
				);

				if (dayEntry) {
					await updateDoc(todosRef, {
						todos: [...dayEntry.todos, newTodo],
					});

					dayEntry.todos.push(newTodo);
				} else {
					await setDoc(todosRef, {
						date: formattedDate,
						todos: [newTodo],
					});

					userTodosList.value.push({
						date: formattedDate,
						todos: [newTodo],
					});
				}
			},
			"Task added!",
			"Failed to add task.",
		);
	}
	// DELETE TODO
	async function deleteTodo(todoId: string) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);

				const dayEntry = userTodosList.value.find(
					(day) => day.date === formattedDate,
				);

				if (!dayEntry) return;

				const updatedTodos = dayEntry.todos.filter((t) => t.id !== todoId);

				const todosRef = doc(
					db,
					"users",
					userUid.value!!,
					"todos",
					formattedDate,
				);

				await updateDoc(todosRef, {
					todos: updatedTodos,
				});

				dayEntry.todos = updatedTodos;
			},
			"Task completed!",
			"Failed to completed task.",
		);
	}

	// UPDATE TODO TEXT
	async function updateTodo(todoId: string, newText: string) {
		const formattedDate = toDateKey(refDate.value);

		const dayEntry = userTodosList.value.find(
			(day) => day.date === formattedDate,
		);

		if (!dayEntry) return;

		const todo = dayEntry.todos.find((t) => t.id === todoId);

		if (!todo) return;

		todo.text = newText;

		try {
			const todosRef = doc(
				db,
				"users",
				userUid.value!!,
				"todos",
				formattedDate,
			);

			await updateDoc(todosRef, {
				todos: dayEntry.todos,
			});
		} catch (error) {
			console.error("Error updating todo:", error);
		}
	}

	return {
		userTodosList,
		selectedDayTodos,
		loadTodosForDate,
		addTodo,
		deleteTodo,
		updateTodo,
	};
});
