import type { TodoItem } from "@/libs/types";

// Liczba odhaczonych kroków zadania
export function subDone(todo: TodoItem) {
	return todo.subtasks?.filter((s) => s.done).length ?? 0;
}
