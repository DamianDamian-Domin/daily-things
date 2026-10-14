<template>
	<section
		class="stats-section"
		aria-labelledby="cat-title">
		<h3
			id="cat-title"
			class="dt-section-title">
			{{ m.energy }}
		</h3>
		<div
			class="cat-bar"
			aria-hidden="true">
			<span
				v-for="c in shares"
				:key="c.key"
				:style="{ width: `${c.pct}%`, background: c.color }"></span>
		</div>
		<ul class="cat-legend">
			<li
				v-for="c in shares"
				:key="c.key">
				<!-- Pikselowa ikona kategorii w kolorze jej paska (zamiast kropki i emoji) -->
				<PixelIcon
					:icon="c.icon"
					:palette="c.palette"
					:size="26" />
				{{ c.label }} <strong>{{ c.pct }}%</strong>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { StatsCategoryShare } from "./useStatsData";
import { statsMessages as m } from "@/i18n/messages/stats";

defineProps<{ shares: StatsCategoryShare[] }>();
</script>

<style scoped>
/* Kategorie */
.cat-bar {
	display: flex;
	height: 0.8rem;
	border-radius: 999px;
	overflow: hidden;
	gap: 2px;
	background: var(--dt-surface-sunken);
}
.cat-bar span {
	display: block;
	height: 100%;
}
.cat-legend {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0.2rem 0.9rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.cat-legend li {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
}
</style>
