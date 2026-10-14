<template>
	<section
		class="stats-section"
		:aria-label="m.monthOverview">
		<div
			class="heat-week"
			aria-hidden="true">
			<span
				v-for="(d, i) in m.weekdayInitials"
				:key="i"
				>{{ d }}</span
			>
		</div>
		<div class="heat-grid">
			<span
				v-for="n in leadingBlanks"
				:key="'b' + n"
				aria-hidden="true"></span>
			<button
				v-for="day in days"
				:key="day.key"
				type="button"
				class="heat-cell"
				:class="[`lvl-${day.level}`, { perfect: day.perfect, today: day.isToday }]"
				:disabled="day.future"
				:aria-label="m.heatAria(day.date, day.total, day.perfect)"
				v-tooltip.top="day.future ? undefined : m.heatTooltip(day.date, day.total)"
				@click="emit('open', day.key)">
				{{ day.dayNum }}
			</button>
		</div>
		<p class="heat-legend">
			<span>{{ m.less }}</span>
			<span
				v-for="l in 5"
				:key="l"
				class="heat-swatch"
				:class="`lvl-${l - 1}`"
				aria-hidden="true"></span>
			<span>{{ m.more }}</span>
			<span class="heat-gold">{{ m.allGoalsLegend }}</span>
		</p>
	</section>
</template>

<script setup lang="ts">
import type { StatsMonthDay } from "./useStatsData";
import { statsMessages as m } from "@/i18n/messages/stats";

defineProps<{ days: StatsMonthDay[]; leadingBlanks: number }>();
const emit = defineEmits<{ open: [key: string] }>();
</script>

<style scoped>
/* Miesiąc — mapa ciepła */
.heat-week,
.heat-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.3rem;
}
.heat-week span {
	text-align: center;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-3);
}
.heat-cell {
	position: relative;
	aspect-ratio: 1;
	border-radius: 0.55rem;
	border: 1px solid transparent;
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-2);
	cursor: pointer;
	transition:
		transform var(--dt-t) var(--dt-spring),
		box-shadow var(--dt-t-fast) ease;
}
@media (hover: hover) {
	.heat-cell:hover:not(:disabled) {
		transform: scale(calc(1 + (1 - var(--dt-press)) * 1.6));
		box-shadow: var(--dt-shadow-sm);
	}
}
.heat-cell:disabled {
	opacity: 0.35;
	cursor: default;
}
.heat-cell.today {
	border-color: var(--dt-accent);
}
.heat-cell.perfect::after {
	content: "";
	position: absolute;
	top: 3px;
	right: 3px;
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--dt-gold);
	box-shadow: 0 0 0 1.5px var(--dt-surface);
}
.lvl-0 {
	background: var(--dt-surface-sunken);
}
.lvl-1 {
	background: color-mix(in srgb, var(--dt-accent) 22%, var(--dt-surface));
}
.lvl-2 {
	background: color-mix(in srgb, var(--dt-accent) 42%, var(--dt-surface));
}
.lvl-3 {
	background: color-mix(in srgb, var(--dt-accent) 64%, var(--dt-surface));
	color: #3b2a20;
}
.lvl-4 {
	background: var(--dt-accent);
	color: #2b1508;
}
.heat-legend {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.3rem;
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.heat-swatch {
	width: 0.85rem;
	height: 0.85rem;
	border-radius: 0.25rem;
}
.heat-gold {
	margin-left: auto;
}
</style>
