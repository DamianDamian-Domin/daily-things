import { defineStore } from "pinia";
import { ref } from "vue";
import { ONBOARDING_STORAGE_KEY } from "@/utils/onboarding";

function readSeen(): boolean {
	try {
		return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "seen";
	} catch {
		return false;
	}
}

// Przewodnik „Jak to działa” — sam wyskakuje raz nowym użytkownikom,
// później otwierany z ustawień. Montowany raz w App.vue.
export const useHelpStore = defineStore("help", () => {
	const isOpen = ref(false);
	const seen = ref(readSeen());

	function markSeen() {
		seen.value = true;
		try {
			localStorage.setItem(ONBOARDING_STORAGE_KEY, "seen");
		} catch {
			/* tryb prywatny — najwyżej zobaczy przewodnik jeszcze raz */
		}
	}

	function open() {
		isOpen.value = true;
	}

	function close() {
		isOpen.value = false;
		markSeen();
	}

	// Po wczytaniu sesji: nowy użytkownik dostaje przewodnik, powracający nie
	function maybeShowOnce(returning: boolean) {
		if (seen.value) return;
		if (returning) markSeen();
		else isOpen.value = true;
	}

	return { isOpen, seen, open, close, maybeShowOnce };
});
