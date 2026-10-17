<template>
	<section
		class="rmood"
		aria-labelledby="rmood-title">
		<div class="rmood-head">
			<h3
				id="rmood-title"
				class="rmood-title">
				Mood
			</h3>
			<span
				v-if="weekAvg"
				class="rmood-avg">
				<PixelIcon
					:icon="weekAvg.icon"
					:palette="weekAvg.palette"
					:size="18" />
				mostly {{ weekAvg.label.toLowerCase() }}
			</span>
		</div>

		<ol
			class="rmood-week"
			:aria-label="weekAria">
			<li
				v-for="d in week"
				:key="d.key"
				:class="{ future: d.future }">
				<PixelIcon
					v-if="d.option"
					:icon="d.option.icon"
					:palette="d.option.palette"
					:size="24" />
				<span
					v-else
					class="rmood-empty"
					aria-hidden="true"></span>
				<span class="rmood-day">{{ d.short }}</span>
			</li>
		</ol>

		<template v-if="links.length">
			<p class="rmood-sub">Over the last 4 weeks</p>
			<ul class="rmood-links">
				<li
					v-for="l in links"
					:key="l.name + l.kind">
					<PixelIcon
						:icon="l.habit.icon"
						:palette="paletteFor(l.habit)"
						:size="24" />
					<span class="rmood-link-text">
						<strong>{{ displayName(l.habit) }}</strong>
						{{ l.kind === "up" ? "goes with better days" : "goes with tougher days" }}
						<small>avg {{ l.withAvg }} with it vs {{ l.withoutAvg }} without · {{ l.daysWith }} days</small>
					</span>
					<span
						class="rmood-diff"
						:class="l.kind">
						{{ l.kind === "up" ? "▲" : "▼" }} {{ Math.abs(l.diff).toFixed(1) }}
					</span>
				</li>
			</ul>
		</template>
		<p
			v-else
			class="rmood-sub">
			{{ emptyText }}
		</p>
	</section>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { addDays, daysInRange, fromDateKey, toDateKey, weekdayName } from "@/utils/date";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import { MIN_MOOD_DAYS, moodInsights, moodOption, nearestMood } from "@/utils/mood";

const props = defineProps<{ start: Date; end: Date }>();
const habitsStore = useHabitsStore();

// Okno korelacji: 4 tygodnie kończące się na oglądanym tygodniu (nie później niż dziś)
const windowEnd = computed(() => {
	const today = fromDateKey(habitsStore.todayKey);
	return props.end > today ? today : props.end;
});
const windowStart = computed(() => addDays(windowEnd.value, -27));

watch(
	[windowStart, windowEnd],
	([start, end]) => habitsStore.ensureRange(start, end),
	{ immediate: true },
);

const week = computed(() =>
	daysInRange(props.start, props.end).map((date) => {
		const key = toDateKey(date);
		return {
			key,
			weekday: weekdayName(date, "long"),
			short: weekdayName(date, "short").slice(0, 2),
			future: key > habitsStore.todayKey,
			option: moodOption(habitsStore.moodOn(key)),
		};
	}),
);

const weekAvg = computed(() => {
	const rated = week.value.filter((d) => d.option).map((d) => d.option!.value);
	return rated.length ? nearestMood(rated.reduce((a, b) => a + b, 0) / rated.length) : null;
});

const weekAria = computed(
	() =>
		"Mood by day: " +
		week.value
			.filter((d) => !d.future)
			.map((d) => `${d.weekday} ${d.option?.label ?? "not rated"}`)
			.join(", "),
);

const insights = computed(() =>
	moodInsights(
		daysInRange(windowStart.value, windowEnd.value).map((date) => {
			const key = toDateKey(date);
			return { date: key, habits: habitsStore.logsOn(key), mood: habitsStore.moodOn(key) };
		}),
		2,
	),
);

const links = computed(() => [
	...insights.value.boosters.map((l) => ({ ...l, kind: "up" as const })),
	...insights.value.drains.slice(0, 1).map((l) => ({ ...l, kind: "down" as const })),
].map((l) => ({ ...l, habit: habitsStore.resolve({ name: l.name }) })));

const emptyText = computed(() => {
	const left = MIN_MOOD_DAYS - insights.value.moodDays;
	if (insights.value.moodDays === 0)
		return "Tap a face on the home screen each evening. After a few days you'll see which habits lift your mood.";
	if (left > 0)
		return `Rate ${left} more ${left === 1 ? "day" : "days"} to see which habits lift your mood.`;
	return "No clear pattern yet. Your mood looks steady whatever you log.";
});
</script>

<style scoped>
.rmood {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	padding: 0.75rem 0.85rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.rmood-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}
.rmood-title {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text);
}
.rmood-avg {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-2);
}
.rmood-week {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.4rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.rmood-week li {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
}
.rmood-week li.future {
	opacity: 0.45;
}
.rmood-empty {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: 2px dashed var(--dt-border-strong);
}
.rmood-day {
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-3);
}
.rmood-sub {
	margin: 0;
	font-size: var(--dt-text-xs);
	line-height: 1.45;
	color: var(--dt-text-3);
}
.rmood-links {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.rmood-links li {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
}
.rmood-link-text {
	flex: 1;
	min-width: 0;
}
.rmood-link-text small {
	display: block;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.rmood-diff {
	flex-shrink: 0;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: var(--dt-success);
}
.rmood-diff.down {
	color: var(--dt-text-3);
}
</style>
