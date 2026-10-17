import { defineStore } from "pinia";
import { ref } from "vue";
import { shellMessages as m } from "@/i18n/messages/shell";

export type ToastTone = "info" | "success" | "error" | "celebrate";

export interface Toast {
	id: number;
	message: string;
	tone: ToastTone;
	actionLabel?: string;
	action?: () => void;
	extra?: ToastExtra;
}

// Druga, mniejsza akcja obok „Cofnij” (np. „Notatka” po odhaczeniu)
export interface ToastExtra {
	label: string;
	icon: string;
	run: () => void;
}

interface ShowOptions {
	tone?: ToastTone;
	actionLabel?: string;
	action?: () => void;
	extra?: ToastExtra;
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
			extra: options.extra,
		};
		// Nowy komunikat z „Cofnij” zastępuje poprzedni z tą samą akcją (bez
		// piętrzenia przy szybkim klikaniu); poza tym maksymalnie 3 naraz.
		if (toast.action) {
			for (const t of toasts.value.filter((t) => t.action && t.actionLabel === toast.actionLabel))
				dismiss(t.id);
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

	function runExtra(id: number) {
		const toast = toasts.value.find((t) => t.id === id);
		dismiss(id);
		toast?.extra?.run();
	}

	function error(message: string = m.genericError) {
		return show(message, { tone: "error", duration: 4500 });
	}

	function undoable(message: string, undo: () => void, extra?: ToastExtra) {
		return show(message, { actionLabel: m.undo, action: undo, extra, duration: extra ? 6000 : undefined });
	}

	return { toasts, show, dismiss, runAction, runExtra, error, undoable };
});
