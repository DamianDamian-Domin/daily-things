import { defineStore } from "pinia";
import { ref } from "vue";

// Które okno „podsumowań” jest otwarte: odznaki, podsumowanie tygodnia, rok,
// wyszukiwarka „kiedy ostatnio”.
// Otwierane z różnych miejsc (statystyki, toast, baner na stronie głównej),
// a montowane raz w App.vue.
export type InsightPanel = "badges" | "recap" | "year" | "lastDone";

export const useInsightsStore = defineStore("insights", () => {
	const panel = ref<InsightPanel | null>(null);
	// Podsumowanie: 0 = bieżący tydzień, -1 = poprzedni itd.
	const recapOffset = ref(-1);
	// „Kiedy ostatnio”: habit do rozwinięcia od razu (np. z okienka habitu)
	const lastDoneFocus = ref<string | null>(null);

	function open(name: InsightPanel, options: { recapOffset?: number; habit?: string } = {}) {
		if (options.recapOffset !== undefined) recapOffset.value = options.recapOffset;
		lastDoneFocus.value = options.habit ?? null;
		panel.value = name;
	}

	function close() {
		panel.value = null;
	}

	return { panel, recapOffset, lastDoneFocus, open, close };
});
