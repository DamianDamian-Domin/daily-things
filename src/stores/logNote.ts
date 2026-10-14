import { defineStore } from "pinia";
import { ref } from "vue";
import type { ToastExtra } from "@/stores/toast";
import type { DateKey } from "@/utils/date";

// Okno notatki do odhaczenia. Otwierane z toastu po odhaczeniu, z okienka
// habitu (stepper) i z historii „kiedy ostatnio”; montowane raz w App.vue.
export const useLogNoteStore = defineStore("logNote", () => {
	const target = ref<{ logId: string; key: DateKey } | null>(null);

	function open(logId: string, key: DateKey) {
		target.value = { logId, key };
	}

	function close() {
		target.value = null;
	}

	// Przycisk „Notatka” w toaście tuż po odhaczeniu
	function toastAction(logId: string, key: DateKey): ToastExtra {
		return { label: "Note", icon: "pi pi-pencil", run: () => open(logId, key) };
	}

	return { target, open, close, toastAction };
});
