<template>
	<BadgesDialog
		:model-value="insights.panel === 'badges'"
		@update:model-value="onToggle('badges', $event)" />
	<WeeklyRecapDialog
		v-if="recapNeeded"
		:model-value="insights.panel === 'recap'"
		@update:model-value="onToggle('recap', $event)" />
	<YearDialog
		v-if="yearNeeded"
		:model-value="insights.panel === 'year'"
		@update:model-value="onToggle('year', $event)" />
	<LastDoneDialog
		v-if="lastDoneNeeded"
		:model-value="insights.panel === 'lastDone'"
		@update:model-value="onToggle('lastDone', $event)" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useInsightsStore, type InsightPanel } from "@/stores/insights";
import BadgesDialog from "./BadgesDialog.vue";
import WeeklyRecapDialog from "./WeeklyRecapDialog.vue";
import YearDialog from "./YearDialog.vue";
import LastDoneDialog from "./LastDoneDialog.vue";

const insights = useInsightsStore();

// Podsumowanie, rok i „kiedy ostatnio” doczytują historię — montujemy je dopiero przy pierwszym otwarciu
const recapNeeded = ref(false);
const yearNeeded = ref(false);
const lastDoneNeeded = ref(false);
watch(
	() => insights.panel,
	(panel) => {
		if (panel === "recap") recapNeeded.value = true;
		if (panel === "year") yearNeeded.value = true;
		if (panel === "lastDone") lastDoneNeeded.value = true;
	},
	{ immediate: true },
);

function onToggle(name: InsightPanel, open: boolean) {
	if (open) insights.open(name);
	else if (insights.panel === name) insights.close();
}
</script>
