<template>
	<section
		class="stats dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="stats-title">
		<header class="stats-head">
			<h2
				id="stats-title"
				class="stats-title">
				Your progress <span aria-hidden="true">📊</span>
			</h2>
			<div
				class="dt-segmented"
				role="group"
				aria-label="Period">
				<button
					type="button"
					:aria-pressed="period === 'week'"
					@click="setPeriod('week')">
					Week
				</button>
				<button
					type="button"
					:aria-pressed="period === 'month'"
					@click="setPeriod('month')">
					Month
				</button>
			</div>
		</header>

		<div class="stats-nav">
			<button
				type="button"
				class="dt-icon-btn"
				:aria-label="`Previous ${period}`"
				@click="offset--">
				<i
					class="pi pi-chevron-left"
					aria-hidden="true"></i>
			</button>
			<p
				class="stats-range"
				aria-live="polite">
				{{ periodLabel }}
			</p>
			<button
				type="button"
				class="dt-icon-btn"
				:aria-label="`Next ${period}`"
				:disabled="offset >= 0"
				@click="offset++">
				<i
					class="pi pi-chevron-right"
					aria-hidden="true"></i>
			</button>
		</div>

		<div class="stats-scroll">
			<!-- KPI -->
			<StatsKpis
				:streak="habitsStore.streak"
				:summary="summary" />

			<!-- TYDZIEŃ: dzień po dniu -->
			<StatsWeekList
				v-if="period === 'week'"
				:days="weekDays"
				@open="openDay" />

			<!-- MIESIĄC: mapa ciepła -->
			<StatsMonthHeatmap
				v-else
				:days="monthDays"
				:leading-blanks="monthLeadingBlanks"
				@open="openDay" />

			<!-- TOP HABITY -->
			<StatsTopHabits
				v-if="topHabits.length"
				:habits="topHabits" />

			<!-- KATEGORIE -->
			<StatsCategories
				v-if="categoryShares.length"
				:shares="categoryShares" />

			<div
				v-if="summary.total === 0"
				class="dt-empty">
				<PixelIcon
					icon="potted_plant"
					palette="green"
					:size="40" />
				<p>Nothing here yet. Every logged habit grows this garden of stats 🌱</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useHabitsStore } from "@/stores/habits";
import { useCarouselStore } from "@/stores/useCarouselStore";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import StatsKpis from "./stats/StatsKpis.vue";
import StatsWeekList from "./stats/StatsWeekList.vue";
import StatsMonthHeatmap from "./stats/StatsMonthHeatmap.vue";
import StatsTopHabits from "./stats/StatsTopHabits.vue";
import StatsCategories from "./stats/StatsCategories.vue";
import { useStatsData, type StatsPeriod } from "./stats/useStatsData";

defineProps<{ isActive: boolean }>();

const habitsStore = useHabitsStore();
const carouselStore = useCarouselStore();

const period = ref<StatsPeriod>("week");
const offset = ref(0);

function setPeriod(p: StatsPeriod) {
	period.value = p;
	offset.value = 0;
}

const { periodLabel, days, weekDays, monthDays, monthLeadingBlanks, summary, topHabits, categoryShares } =
	useStatsData(period, offset);

function openDay(key: string) {
	const d = days.value.find((x) => x.key === key);
	if (!d || d.future) return;
	habitsStore.setDate(d.dateObj);
	carouselStore.setActiveCard("manage");
}
</script>

<style scoped>
.stats {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}
@media (min-width: 641px) {
	.stats {
		width: 30rem;
	}
}
.stats.is-inactive {
	pointer-events: none;
	user-select: none;
}
.stats-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	flex-wrap: wrap;
}
.stats-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
}
.stats-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	padding: 0.1rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.stats-range {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text-2);
	text-align: center;
}

.stats-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin: 0 -0.35rem;
	padding: 0.25rem 0.35rem 0.75rem;
	overscroll-behavior: contain;
}

/* Wspólny układ sekcji — działa też na korzeniach komponentów z ./stats (dziedziczą atrybut scope rodzica) */
.stats-section {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}
</style>
