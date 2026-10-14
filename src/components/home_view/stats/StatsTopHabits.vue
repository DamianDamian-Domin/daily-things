<template>
	<section
		class="stats-section"
		aria-labelledby="top-title">
		<h3
			id="top-title"
			class="dt-section-title">
			Most logged
		</h3>
		<ul class="bars">
			<li
				v-for="h in habits"
				:key="h.name"
				class="bar-row">
				<PixelIcon
					:icon="h.habit.icon"
					:palette="paletteFor(h.habit)"
					:size="26" />
				<span class="bar-name">{{ h.habit.display_name }}</span>
				<span
					class="bar-track"
					aria-hidden="true">
					<span
						class="bar-fill"
						:class="{ negative: h.habit.severity === 'danger' }"
						:style="{ width: `${h.pct}%` }"></span>
				</span>
				<span class="bar-count">{{ h.count }}×</span>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import { paletteFor } from "@/utils/habitCatalog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { StatsTopHabit } from "./useStatsData";

defineProps<{ habits: StatsTopHabit[] }>();
</script>

<style scoped>
/* Top habity */
.bars {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
}
.bar-row {
	display: grid;
	grid-template-columns: auto minmax(5rem, 8rem) 1fr auto;
	align-items: center;
	gap: 0.6rem;
}
.bar-name {
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.bar-track {
	height: 0.55rem;
	border-radius: 999px;
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.bar-fill {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--dt-accent), color-mix(in srgb, var(--dt-accent) 70%, #f3c64f));
	transition: width 0.4s var(--dt-ease);
}
.bar-fill.negative {
	background: #a86f8a;
}
.bar-count {
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text-2);
	font-variant-numeric: tabular-nums;
}
</style>
