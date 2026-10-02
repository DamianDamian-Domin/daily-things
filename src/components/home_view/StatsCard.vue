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
			<dl class="kpis">
				<div class="kpi">
					<PixelIcon
						icon="local_fire_department"
						palette="orange"
						:size="30" />
					<dt>Current streak</dt>
					<dd>
						{{ habbitsStore.streak }} <small>{{ habbitsStore.streak === 1 ? "day" : "days" }}</small>
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

			<!-- TYDZIEŃ: dzień po dniu -->
			<section
				v-if="period === 'week'"
				class="stats-section"
				aria-label="Days">
				<ul class="day-list">
					<li
						v-for="day in weekDays"
						:key="day.key">
						<button
							type="button"
							class="day-row"
							:class="{ perfect: day.perfect, future: day.future }"
							:disabled="day.future"
							:aria-label="`${day.name} ${day.date}: ${day.total} logged${day.perfect ? ', all goals done' : ''}. Open day`"
							@click="openDay(day.key)">
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

			<!-- MIESIĄC: mapa ciepła -->
			<section
				v-else
				class="stats-section"
				aria-label="Month overview">
				<div
					class="heat-week"
					aria-hidden="true">
					<span
						v-for="(d, i) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']"
						:key="i"
						>{{ d }}</span
					>
				</div>
				<div class="heat-grid">
					<span
						v-for="n in monthLeadingBlanks"
						:key="'b' + n"
						aria-hidden="true"></span>
					<button
						v-for="day in monthDays"
						:key="day.key"
						type="button"
						class="heat-cell"
						:class="[`lvl-${day.level}`, { perfect: day.perfect, today: day.isToday }]"
						:disabled="day.future"
						:aria-label="`${day.date}: ${day.total} logged${day.perfect ? ', all goals done' : ''}`"
						v-tooltip.top="day.future ? undefined : `${day.date} · ${day.total} logged`"
						@click="openDay(day.key)">
						{{ day.dayNum }}
					</button>
				</div>
				<p class="heat-legend">
					<span>Less</span>
					<span
						v-for="l in 5"
						:key="l"
						class="heat-swatch"
						:class="`lvl-${l - 1}`"
						aria-hidden="true"></span>
					<span>More</span>
					<span class="heat-gold">🏅 = all goals</span>
				</p>
			</section>

			<!-- TOP HABITY -->
			<section
				v-if="topHabbits.length"
				class="stats-section"
				aria-labelledby="top-title">
				<h3
					id="top-title"
					class="dt-section-title">
					Most logged
				</h3>
				<ul class="bars">
					<li
						v-for="h in topHabbits"
						:key="h.name"
						class="bar-row">
						<PixelIcon
							:icon="h.habbit.icon"
							:palette="paletteFor(h.habbit)"
							:size="26" />
						<span class="bar-name">{{ h.habbit.display_name }}</span>
						<span
							class="bar-track"
							aria-hidden="true">
							<span
								class="bar-fill"
								:class="{ negative: h.habbit.severity === 'danger' }"
								:style="{ width: `${h.pct}%` }"></span>
						</span>
						<span class="bar-count">{{ h.count }}×</span>
					</li>
				</ul>
			</section>

			<!-- KATEGORIE -->
			<section
				v-if="categoryShares.length"
				class="stats-section"
				aria-labelledby="cat-title">
				<h3
					id="cat-title"
					class="dt-section-title">
					Where your energy went
				</h3>
				<div
					class="cat-bar"
					aria-hidden="true">
					<span
						v-for="c in categoryShares"
						:key="c.key"
						:style="{ width: `${c.pct}%`, background: c.color }"></span>
				</div>
				<ul class="cat-legend">
					<li
						v-for="c in categoryShares"
						:key="c.key">
						<span
							class="cat-dot"
							:style="{ background: c.color }"
							aria-hidden="true"></span>
						{{ c.emoji }} {{ c.label }} <strong>{{ c.pct }}%</strong>
					</li>
				</ul>
			</section>

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
import { computed, ref, watch } from "vue";
import type { Habbit } from "@/libs/types";
import { useHabbitsStore } from "@/stores/habbits";
import { useCarouselStore } from "@/stores/useCarouselStore";
import {
	addDays,
	daysInRange,
	formatMonth,
	formatShortDate,
	isoWeek,
	startOfDay,
	startOfWeek,
	toDateKey,
	weekdayName,
} from "@/utils/date";
import { CUSTOM_CATEGORY, isNegative, paletteFor, superCategoryOf } from "@/utils/habitCatalog";
import { PALETTES } from "@/utils/pixelIcons";
import PixelIcon from "@/components/ui/PixelIcon.vue";

defineProps<{ isActive: boolean }>();

const habbitsStore = useHabbitsStore();
const carouselStore = useCarouselStore();

const period = ref<"week" | "month">("week");
const offset = ref(0);

function setPeriod(p: "week" | "month") {
	period.value = p;
	offset.value = 0;
}

const range = computed(() => {
	const today = startOfDay();
	if (period.value === "week") {
		const start = addDays(startOfWeek(today), offset.value * 7);
		return { start, end: addDays(start, 6) };
	}
	const start = new Date(today.getFullYear(), today.getMonth() + offset.value, 1);
	return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
});

const periodLabel = computed(() => {
	const { start, end } = range.value;
	if (period.value === "month") return formatMonth(start);
	if (offset.value === 0) return `This week · ${formatShortDate(start)} – ${formatShortDate(end)}`;
	if (offset.value === -1) return `Last week · ${formatShortDate(start)} – ${formatShortDate(end)}`;
	return `Week ${isoWeek(start)} · ${formatShortDate(start)} – ${formatShortDate(end)}`;
});

// Doczytujemy tylko brakujące miesiące (store cache'uje je na całą sesję)
watch(
	[range, () => habbitsStore.dailyGoalsList],
	() => habbitsStore.ensureRange(range.value.start, range.value.end),
	{ immediate: true },
);

// ==========================================
// DANE DNI
// ==========================================
const todayKey = computed(() => habbitsStore.todayKey);

const days = computed(() =>
	daysInRange(range.value.start, range.value.end).map((date) => {
		const key = toDateKey(date);
		const logs = habbitsStore.logsOn(key);
		const goals = habbitsStore.dayGoalsProgress(key);
		return {
			key,
			dateObj: date,
			date: formatShortDate(date),
			name: key === todayKey.value ? "Today" : weekdayName(date, "short"),
			dayNum: date.getDate(),
			future: key > todayKey.value,
			isToday: key === todayKey.value,
			total: logs.length,
			perfect: goals.perfect,
			groups: habbitsStore.groupLogs(logs).sort((a, b) => b.count - a.count),
		};
	}),
);

// Przyszłe dni bieżącego tygodnia tylko zajmowałyby miejsce
const weekDays = computed(() => days.value.filter((d) => !d.future).reverse());

const monthDays = computed(() => {
	const max = Math.max(1, ...days.value.map((d) => d.total));
	return days.value.map((d) => ({
		...d,
		level: d.total === 0 ? 0 : Math.min(4, Math.ceil((d.total / max) * 4)),
	}));
});
const monthLeadingBlanks = computed(() => (range.value.start.getDay() + 6) % 7);

const summary = computed(() => {
	let total = 0;
	let positive = 0;
	let perfectDays = 0;
	let elapsedDays = 0;
	for (const d of days.value) {
		if (d.future) continue;
		elapsedDays++;
		total += d.total;
		if (d.perfect) perfectDays++;
		for (const g of d.groups) if (!isNegative(g.habbit)) positive += g.count;
	}
	return { total, positive, perfectDays, elapsedDays };
});

// ==========================================
// TOP I KATEGORIE
// ==========================================
const totals = computed(() => {
	const map = new Map<string, { name: string; habbit: Habbit; count: number }>();
	for (const d of days.value) {
		for (const g of d.groups) {
			const entry = map.get(g.name);
			if (entry) entry.count += g.count;
			else map.set(g.name, { name: g.name, habbit: g.habbit, count: g.count });
		}
	}
	return [...map.values()].sort((a, b) => b.count - a.count);
});

const topHabbits = computed(() => {
	const top = totals.value.slice(0, 8);
	const max = top[0]?.count ?? 1;
	return top.map((t) => ({ ...t, pct: Math.max(6, Math.round((t.count / max) * 100)) }));
});

const categoryShares = computed(() => {
	const map = new Map<string, { key: string; label: string; emoji: string; color: string; count: number }>();
	let sum = 0;
	for (const t of totals.value) {
		if (isNegative(t.habbit)) continue;
		const cat = superCategoryOf(t.habbit) ?? CUSTOM_CATEGORY;
		const entry = map.get(cat.key);
		if (entry) entry.count += t.count;
		else
			map.set(cat.key, {
				key: cat.key,
				label: cat.label,
				emoji: cat.emoji,
				color: PALETTES[cat.palette].f,
				count: t.count,
			});
		sum += t.count;
	}
	return [...map.values()]
		.sort((a, b) => b.count - a.count)
		.map((c) => ({ ...c, pct: Math.round((c.count / sum) * 100) }))
		.filter((c) => c.pct > 0);
});

function openDay(key: string) {
	const d = days.value.find((x) => x.key === key);
	if (!d || d.future) return;
	habbitsStore.setDate(d.dateObj);
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

.stats-section {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}

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
	transition: background-color 0.18s ease;
}
.day-row:hover:not(:disabled) {
	background: var(--dt-surface-soft);
}
.day-row.perfect {
	background: color-mix(in srgb, var(--dt-gold) 12%, var(--dt-surface));
	border-color: color-mix(in srgb, var(--dt-gold) 35%, transparent);
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
	transition: transform 0.15s var(--dt-ease);
}
.heat-cell:hover:not(:disabled) {
	transform: scale(1.08);
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
	gap: 0.35rem 0.9rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.cat-legend li {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
}
.cat-dot {
	width: 0.6rem;
	height: 0.6rem;
	border-radius: 50%;
}
</style>
