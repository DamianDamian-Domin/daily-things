<template>
	<!-- Odznaki, podsumowanie tygodnia, rok, „kiedy ostatnio” -->
	<div
		class="insight-row"
		role="group"
		aria-label="More insights">
		<button
			type="button"
			class="insight-btn"
			@click="insights.open('recap', { recapOffset: period === 'week' ? Math.min(offset, 0) : -1 })">
			<PixelIcon
				icon="celebration"
				palette="orange"
				:size="22" />
			Recap
		</button>
		<button
			type="button"
			class="insight-btn"
			@click="insights.open('badges')">
			<PixelIcon
				icon="trophy"
				palette="yellow"
				:size="22" />
			Badges <span class="insight-count">{{ achievements.unlockedIds.length }}</span>
		</button>
		<button
			type="button"
			class="insight-btn"
			@click="insights.open('year')">
			<PixelIcon
				icon="calendar_month"
				palette="green"
				:size="22" />
			Year
		</button>
		<button
			type="button"
			class="insight-btn"
			@click="insights.open('lastDone')">
			<PixelIcon
				icon="schedule"
				palette="blue"
				:size="22" />
			Last done
		</button>
	</div>
</template>

<script setup lang="ts">
import { useAchievementsStore } from "@/stores/achievements";
import { useInsightsStore } from "@/stores/insights";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { StatsPeriod } from "./useStatsData";

defineProps<{ period: StatsPeriod; offset: number }>();

const achievements = useAchievementsStore();
const insights = useInsightsStore();
</script>

<style scoped>
.insight-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
}
.insight-btn {
	display: inline-flex;
	flex: 1 1 0;
	white-space: nowrap;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	min-height: 2.4rem;
	padding: 0.35rem 0.6rem;
	font: inherit;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
	border-radius: var(--dt-radius-pill);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface-soft);
	cursor: pointer;
	transition:
		background var(--dt-t-fast) var(--dt-ease),
		border-color var(--dt-t-fast) var(--dt-ease),
		transform var(--dt-t-fast) var(--dt-ease);
}
.insight-btn:hover {
	background: var(--dt-hover-bg);
	border-color: var(--dt-hover-border);
}
.insight-btn:active {
	transform: scale(var(--dt-press));
}
.insight-btn:focus-visible {
	outline: none;
	box-shadow: var(--dt-focus-ring);
}
/* Wąski ekran: 2 × 2 zamiast trzech przycisków i jednego na całą szerokość */
@media (max-width: 520px) {
	.insight-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
	}
}
.insight-count {
	min-width: 1.3rem;
	padding: 0 0.35rem;
	font-size: var(--dt-text-xs);
	border-radius: var(--dt-radius-pill);
	color: var(--dt-accent-ink);
	background: var(--dt-accent-soft);
}
</style>
