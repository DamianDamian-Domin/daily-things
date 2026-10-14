<template>
	<section
		class="stats-section"
		aria-label="Days">
		<ul class="day-list">
			<li
				v-for="day in days"
				:key="day.key">
				<button
					type="button"
					class="day-row"
					:class="{ perfect: day.perfect, future: day.future }"
					:disabled="day.future"
					:aria-label="`${day.name} ${day.date}: ${day.total} logged${day.perfect ? ', all goals done' : ''}. Open day`"
					@click="emit('open', day.key)">
					<span class="day-when">
						<span class="day-name">{{ day.name }}</span>
						<span class="day-date">{{ day.date }}</span>
					</span>
					<span class="day-tiles">
						<template v-if="day.groups.length">
							<span
								v-for="g in day.groups.slice(0, 7)"
								:key="g.name"
								class="mini-tile">
								<PixelIcon
									:icon="g.habbit.icon"
									:palette="paletteFor(g.habbit)"
									:size="24" />
								<span
									v-if="g.count > 1"
									class="mini-count"
									>{{ g.count }}</span
								>
							</span>
							<span
								v-if="day.groups.length > 7"
								class="mini-more"
								>+{{ day.groups.length - 7 }}</span
							>
						</template>
						<span
							v-else
							class="day-empty"
							>{{ day.future ? "" : "—" }}</span
						>
					</span>
					<span
						v-if="day.perfect"
						class="day-medal"
						aria-hidden="true"
						>🏅</span
					>
				</button>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import { paletteFor } from "@/utils/habitCatalog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { StatsDay } from "./useStatsData";

defineProps<{ days: StatsDay[] }>();
const emit = defineEmits<{ open: [key: string] }>();
</script>

<style scoped>
/* Tydzień */
.day-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}
.day-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	min-height: 3rem;
	padding: 0.4rem 0.6rem;
	border-radius: var(--dt-radius);
	border: 1px solid transparent;
	background: transparent;
	color: inherit;
	text-align: left;
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease;
}
.day-row.perfect {
	background: color-mix(in srgb, var(--dt-gold) 12%, var(--dt-surface));
	border-color: color-mix(in srgb, var(--dt-gold) 35%, transparent);
}
@media (hover: hover) {
	.day-row:hover:not(:disabled) {
		background: var(--dt-hover-bg);
		border-color: color-mix(in srgb, var(--dt-accent) 22%, transparent);
	}
	.day-row.perfect:hover:not(:disabled) {
		background: color-mix(in srgb, var(--dt-gold) 20%, var(--dt-surface));
		border-color: color-mix(in srgb, var(--dt-gold) 55%, transparent);
	}
}
.day-row.future {
	opacity: 0.45;
	cursor: default;
}
.day-when {
	display: flex;
	flex-direction: column;
	width: 3.2rem;
	flex-shrink: 0;
}
.day-name {
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text);
}
.day-date {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.day-tiles {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.3rem;
	flex: 1;
	min-width: 0;
}
.mini-tile {
	position: relative;
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 0.6rem;
	background: var(--dt-surface-sunken);
}
.mini-count {
	position: absolute;
	top: -0.3rem;
	right: -0.3rem;
	min-width: 1rem;
	height: 1rem;
	padding: 0 0.2rem;
	border-radius: 999px;
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	font-size: 0.6rem;
	font-weight: 700;
	display: grid;
	place-items: center;
}
.mini-more,
.day-empty {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	font-weight: 600;
}
.day-medal {
	font-size: 1.1rem;
}
</style>
