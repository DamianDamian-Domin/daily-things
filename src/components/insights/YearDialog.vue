<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'year-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog insights-dialog year-dialog"
		@show="scrollToEnd">
		<div class="ins">
			<div class="ins-head">
				<PixelIcon
					icon="calendar_month"
					palette="green"
					:size="40" />
				<div class="ins-head-text">
					<h2
						id="year-title"
						class="dt-title">
						{{ m.yourYear }}
					</h2>
					<p class="dt-subtitle">{{ rangeLabel }}</p>
				</div>
				<button
					type="button"
					class="dt-icon-btn"
					:aria-label="common.close"
					@click="visible = false">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>

			<dl class="year-kpis">
				<div>
					<dd>{{ totals.activeDays }}</dd>
					<dt>{{ m.activeDays(totals.activeDays) }}</dt>
				</div>
				<div>
					<dd>{{ totals.perfectDays }}</dd>
					<dt>{{ m.perfectDays(totals.perfectDays) }}</dt>
				</div>
				<div>
					<dd>{{ totals.bestStreak }}</dd>
					<dt>{{ m.longestStreak }}</dt>
				</div>
				<div>
					<dd>{{ totals.checkIns }}</dd>
					<dt>{{ m.habitsLogged(totals.checkIns) }}</dt>
				</div>
			</dl>

			<p
				v-if="loading"
				class="year-loading"
				aria-live="polite">
				{{ m.gatheringYear }}
			</p>

			<div
				ref="scrollRef"
				class="year-scroll">
				<div
					class="year-grid"
					:style="{ '--weeks': weeks.length }">
					<span
						class="year-corner"
						aria-hidden="true"></span>
					<span
						v-for="(w, i) in weeks"
						:key="'m' + i"
						class="year-month"
						aria-hidden="true"
						>{{ w.monthLabel }}</span
					>
					<template
						v-for="row in 7"
						:key="'r' + row">
						<span
							class="year-wd"
							aria-hidden="true"
							>{{ row % 2 === 1 ? m.weekdays3[row - 1] : "" }}</span
						>
						<button
							v-for="w in weeks"
							:key="w.days[row - 1].key"
							type="button"
							class="year-cell"
							:class="[
								`lvl-${w.days[row - 1].level}`,
								{ perfect: w.days[row - 1].perfect, out: w.days[row - 1].out },
							]"
							:disabled="w.days[row - 1].out"
							:aria-label="w.days[row - 1].label"
							v-tooltip.top="w.days[row - 1].out ? undefined : w.days[row - 1].label"
							@click="openDay(w.days[row - 1].key)"></button>
					</template>
				</div>
			</div>

			<p class="heat-legend">
				<span>{{ m.less }}</span>
				<span
					v-for="l in 5"
					:key="l"
					class="year-cell is-swatch"
					:class="`lvl-${l - 1}`"
					aria-hidden="true"></span>
				<span>{{ m.more }}</span>
				<span
					class="year-cell is-swatch perfect lvl-3"
					aria-hidden="true"></span>
				<span>{{ m.allGoals }}</span>
			</p>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { addDays, formatShortDate, fromDateKey, startOfDay, startOfWeek, toDateKey } from "@/utils/date";
import { isNegative } from "@/utils/habitCatalog";
import { longestRun } from "@/utils/streak";
import { insightsMessages as m } from "@/i18n/messages/insights";
import { commonMessages as common } from "@/i18n/messages/common";
import { dateLocale } from "@/i18n";

const WEEKS = 53;

const visible = defineModel<boolean>({ default: false });
const habitsStore = useHabitsStore();
const carouselStore = useCarouselStore();

const today = computed(() => fromDateKey(habitsStore.todayKey));
const start = computed(() => addDays(startOfWeek(today.value), -(WEEKS - 1) * 7));
const firstDay = computed(() => addDays(today.value, -364));

const loading = ref(true);
onMounted(async () => {
	await habitsStore.ensureRange(firstDay.value, today.value);
	loading.value = false;
});

const rangeLabel = computed(
	() => `${formatShortDate(firstDay.value)} ${firstDay.value.getFullYear()} – ${formatShortDate(today.value)}`,
);

const weeks = computed(() => {
	const counts: number[] = [];
	const cells: Array<{ key: string; date: Date; count: number; perfect: boolean; out: boolean }> = [];
	const firstKey = toDateKey(firstDay.value);
	for (let i = 0; i < WEEKS * 7; i++) {
		const date = addDays(start.value, i);
		const key = toDateKey(date);
		const out = key > habitsStore.todayKey || key < firstKey;
		const count = out ? 0 : habitsStore.logsOn(key).length;
		if (count) counts.push(count);
		cells.push({ key, date, count, perfect: !out && habitsStore.dayGoalsProgress(key).perfect, out });
	}
	// Poziomy względem „typowego dobrego dnia” (90. percentyl), nie rekordu
	counts.sort((a, b) => a - b);
	const high = Math.max(1, counts[Math.floor(counts.length * 0.9)] ?? 1);
	const result = [];
	for (let w = 0; w < WEEKS; w++) {
		const days = cells.slice(w * 7, w * 7 + 7).map((c) => ({
			...c,
			level: c.count === 0 ? 0 : Math.min(4, Math.ceil((c.count / high) * 4)),
			label: m.yearCell(formatShortDate(c.date), c.count, c.perfect),
		}));
		const first = days[0].date;
		const prev = addDays(first, -7);
		result.push({
			days,
			monthLabel: w === 0 || first.getMonth() !== prev.getMonth()
				? first.toLocaleDateString(dateLocale(), { month: "short" })
				: "",
		});
	}
	return result;
});

const totals = computed(() => {
	let activeDays = 0;
	let perfectDays = 0;
	let checkIns = 0;
	const logged: string[] = [];
	for (let d = startOfDay(firstDay.value); d <= today.value; d = addDays(d, 1)) {
		const key = toDateKey(d);
		const logs = habitsStore.logsOn(key);
		if (logs.length) {
			activeDays++;
			logged.push(key);
		}
		if (habitsStore.dayGoalsProgress(key).perfect) perfectDays++;
		for (const log of logs) if (!isNegative(habitsStore.resolve(log))) checkIns++;
	}
	return { activeDays, perfectDays, checkIns, bestStreak: longestRun(logged) };
});

const scrollRef = ref<HTMLElement | null>(null);
function scrollToEnd() {
	nextTick(() => {
		if (scrollRef.value) scrollRef.value.scrollLeft = scrollRef.value.scrollWidth;
	});
}

function openDay(key: string) {
	habitsStore.setDate(fromDateKey(key));
	carouselStore.setActiveCard("manage");
	visible.value = false;
}
</script>

<style scoped>
.ins {
	--cell: 0.8rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.1rem 1.25rem 1.25rem;
}
.ins-head {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}
.ins-head-text {
	flex: 1;
	min-width: 0;
}
.year-kpis {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 0.5rem;
	margin: 0;
}
.year-kpis div {
	padding: 0.55rem 0.3rem;
	text-align: center;
	border-radius: var(--dt-radius);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.year-kpis dd {
	margin: 0;
	font-size: var(--dt-text-lg);
	font-weight: 700;
	color: var(--dt-text);
}
.year-kpis dt {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
}
.year-loading {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
}
.year-scroll {
	overflow-x: auto;
	padding-bottom: 0.4rem;
	scrollbar-width: thin;
}
.year-grid {
	display: grid;
	grid-template-columns: 1.8rem repeat(var(--weeks), var(--cell));
	grid-auto-rows: var(--cell);
	grid-auto-flow: row;
	gap: 3px;
	width: max-content;
}
.year-corner {
	grid-row: 1;
}
.year-month {
	font-size: 0.62rem;
	line-height: var(--cell);
	white-space: nowrap;
	color: var(--dt-text-3);
	overflow: visible;
}
.year-wd {
	font-size: 0.6rem;
	line-height: var(--cell);
	color: var(--dt-text-3);
}
.year-cell {
	width: var(--cell);
	height: var(--cell);
	padding: 0;
	border: 0;
	border-radius: 3px;
	background: var(--dt-surface-sunken);
	cursor: pointer;
}
.year-cell:not(:disabled):hover {
	outline: 2px solid var(--dt-accent);
	outline-offset: 1px;
}
.year-cell:focus-visible {
	outline: 2px solid var(--dt-focus);
	outline-offset: 1px;
}
.year-cell.out {
	visibility: hidden;
}
.year-cell.lvl-1 {
	background: color-mix(in srgb, var(--dt-accent) 28%, var(--dt-surface-sunken));
}
.year-cell.lvl-2 {
	background: color-mix(in srgb, var(--dt-accent) 50%, var(--dt-surface-sunken));
}
.year-cell.lvl-3 {
	background: color-mix(in srgb, var(--dt-accent) 75%, var(--dt-surface-sunken));
}
.year-cell.lvl-4 {
	background: var(--dt-accent);
}
.year-cell.perfect {
	box-shadow: inset 0 0 0 2px var(--dt-gold);
}
.year-cell.is-swatch {
	display: inline-block;
	cursor: default;
}
.heat-legend {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.3rem;
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.heat-legend > span:nth-child(7) {
	margin-left: 0.75rem;
}
@media (min-width: 720px) {
	.ins {
		--cell: 0.85rem;
	}
}
</style>

<style>
.year-dialog.p-dialog {
	width: min(96vw, 58rem);
}
</style>
