import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { nanoid } from "nanoid";

import { useAuthStore } from "./auth";
import { handleAsyncAction } from "@/stores/asyncActionHandler";

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    description?: string; 
    createdAt?: number; 
}

export const useTodosStore = defineStore("todos", () => {
    const authStore = useAuthStore();
    const { userUid } = storeToRefs(authStore);

    // Teraz mamy po prostu jedną płaską listę wszystkich zadań
    const userTodosList = ref<TodoItem[]>([]);

    // =========================
    // ALL TODOS (WITH SORTING)
    // =========================
    // Zmieniliśmy nazwę z selectedDayTodos na sortedTodos
    const sortedTodos = computed(() => {
        return [...userTodosList.value].sort((a, b) => {
            if (a.completed === b.completed) {
                const timeA = a.createdAt || 0;
                const timeB = b.createdAt || 0;
                return timeB - timeA; 
            }
            return a.completed ? 1 : -1;
        });
    });

    // =========================
    // LOAD TODOS
    // =========================
    async function loadTodos() {
        try {
            const userDocRef = doc(db, "users", userUid.value!!);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().todos) {
                const loadedTodos = userDoc.data().todos;

                // TRICK MIGRACYJNY: Jeśli dane są w starym formacie (z datami), spłaszczamy je
                if (loadedTodos.length > 0 && loadedTodos[0].date !== undefined) {
                     const flatTodos = loadedTodos.flatMap((entry: any) => entry.todos);
                     userTodosList.value = flatTodos;
                     await updateDoc(userDocRef, { todos: flatTodos }); // Aktualizacja bazy
                } else {
                    userTodosList.value = loadedTodos;
                }
            } else {
                await setDoc(userDocRef, { todos: [] }, { merge: true });
                userTodosList.value = [];
            }
        } catch (error) {
            console.error("Error loading todos:", error);
        }
    }

    // =========================
    // ADD TODO
    // =========================
    async function addTodo(text: string, description: string = "") {
        await handleAsyncAction(
            async () => {
                const newTodo: TodoItem = {
                    id: nanoid(),
                    text,
                    description,
                    completed: false,
                    createdAt: Date.now(),
                };

                userTodosList.value.push(newTodo);

                const userDocRef = doc(db, "users", userUid.value!!);
                await updateDoc(userDocRef, { todos: userTodosList.value });
            },
            "Task added!",
            "Failed to add task."
        );
    }

    // =========================
    // DELETE TODO
    // =========================
    async function deleteTodo(todoId: string) {
        await handleAsyncAction(
            async () => {
                userTodosList.value = userTodosList.value.filter((t) => t.id !== todoId);

                const userDocRef = doc(db, "users", userUid.value!!);
                await updateDoc(userDocRef, { todos: userTodosList.value });
            },
            "Task deleted!",
            "Failed to delete task."
        );
    }

    // =========================
    // UPDATE TODO
    // =========================
    async function updateTodo(
        todoId: string,
        newText: string,
        newDescription: string = "",
    ) {
        const todo = userTodosList.value.find((t) => t.id === todoId);
        if (!todo) return;

        todo.text = newText;
        todo.description = newDescription;

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
        const todo = userTodosList.value.find((t) => t.id === todoId);
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
        sortedTodos,
        loadTodos,
        addTodo,
        deleteTodo,
        updateTodo,
        toggleTodo,
    };
});