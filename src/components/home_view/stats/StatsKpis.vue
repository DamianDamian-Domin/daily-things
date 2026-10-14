<template>
	<dl class="kpis">
		<div class="kpi">
			<PixelIcon
				icon="local_fire_department"
				palette="orange"
				:size="30" />
			<dt>Current streak</dt>
			<dd>
				{{ streak }} <small>{{ streak === 1 ? "day" : "days" }}</small>
				<span
					v-if="freezeUsed"
					class="kpi-freeze"
					v-tooltip.top="'One missed day a week won\'t break your streak'"
					aria-label="A free pass saved your streak this week"
					>❄️</span
				>
			</dd>
		</div>
		<div class="kpi">
			<PixelIcon
				icon="trophy"
				palette="yellow"
				:size="30" />
			<dt>Perfect days</dt>
			<dd>
				{{ summary.perfectDays }} <small>/ {{ summary.elapsedDays }}</small>
			</dd>
		</div>
		<div class="kpi">
			<PixelIcon
				icon="check_circle"
				palette="green"
				:size="30" />
			<dt>Habits logged</dt>
			<dd>{{ summary.positive }}</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { StatsSummary } from "./useStatsData";

defineProps<{ streak: number; summary: StatsSummary; freezeUsed?: boolean }>();
</script>

<style scoped>
.kpis {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin: 0;
}
.kpi {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.15rem;
	padding: 0.7rem 0.4rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
	text-align: center;
}
.kpi dt {
	order: 3;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	line-height: 1.2;
}
.kpi dd {
	order: 2;
	margin: 0.2rem 0 0;
	font-size: 1.3rem;
	font-weight: 700;
	color: var(--dt-text);
	font-variant-numeric: tabular-nums;
	line-height: 1;
}
.kpi dd small {
	font-size: 0.7rem;
	font-weight: 600;
	color: var(--dt-text-3);
}
.kpi-freeze {
	margin-left: 0.15rem;
	font-size: 0.85em;
	cursor: help;
}
</style>
