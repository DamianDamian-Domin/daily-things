import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastTone = "info" | "success" | "error" | "celebrate";

export interface Toast {
	id: number;
	message: string;
	tone: ToastTone;
	actionLabel?: string;
	action?: () => void;
}

interface ShowOptions {
	tone?: ToastTone;
	actionLabel?: string;
	action?: () => void;
	duration?: number;
}

// Jedno miejsce na komunikaty dla użytkownika — również błędy zapisu,
// które wcześniej lądowały tylko w konsoli.
export const useToastStore = defineStore("toast", () => {
	const toasts = ref<Toast[]>([]);
	const timers = new Map<number, ReturnType<typeof setTimeout>>();
	let nextId = 1;

	function dismiss(id: number) {
		toasts.value = toasts.value.filter((t) => t.id !== id);
		const timer = timers.get(id);
		if (timer) clearTimeout(timer);
		timers.delete(id);
	}

	function show(message: string, options: ShowOptions = {}) {
		const id = nextId++;
		const toast: Toast = {
			id,
			message,
			tone: options.tone ?? "info",
			actionLabel: options.actionLabel,
			action: options.action,
		};
		// Nowy komunikat z „Cofnij” zastępuje poprzedni (bez piętrzenia przy
		// szybkim klikaniu); poza tym maksymalnie 3 naraz.
		if (toast.action) {
			for (const t of toasts.value.filter((t) => t.action)) dismiss(t.id);
		}
		toasts.value = [...toasts.value.slice(-2), toast];
		const duration = options.duration ?? (options.action ? 5000 : 2800);
		timers.set(
			id,
			setTimeout(() => dismiss(id), duration),
		);
		return id;
	}

	function runAction(id: number) {
		const toast = toasts.value.find((t) => t.id === id);
		dismiss(id);
		toast?.action?.();
	}

	function error(message = "Something went wrong. Please try again.") {
		return show(message, { tone: "error", duration: 4500 });
	}

	function undoable(message: string, undo: () => void) {
		return show(message, { actionLabel: "Undo", action: undo });
	}

	return { toasts, show, dismiss, runAction, error, undoable };
});
