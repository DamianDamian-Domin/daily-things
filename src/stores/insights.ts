import { defineStore } from "pinia";
import { ref } from "vue";

// Które okno „podsumowań” jest otwarte: odznaki, podsumowanie tygodnia, rok.
// Otwierane z różnych miejsc (statystyki, toast, baner na stronie głównej),
// a montowane raz w App.vue.
export type InsightPanel = "badges" | "recap" | "year";

export const useInsightsStore = defineStore("insights", () => {
	const panel = ref<InsightPanel | null>(null);
	// Podsumowanie: 0 = bieżący tydzień, -1 = poprzedni itd.
	const recapOffset = ref(-1);

	function open(name: InsightPanel, options: { recapOffset?: number } = {}) {
		if (options.recapOffset !== undefined) recapOffset.value = options.recapOffset;
		panel.value = name;
	}

	function close() {
		panel.value = null;
	}

	return { panel, recapOffset, open, close };
});
