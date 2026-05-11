<template>
	<div class="sc-card card-a sm:w-[480px] surface-content w-full h-full min-h-[30rem] max-h-[50rem] overflow-hidden">
		<div
			class="sc-inner"
			:class="!isActive && 'pointer-events-none'">

			<!-- Header -->
			<div class="sc-top">
				<h3 class="sc-title">Summary 📊</h3>
				<!-- Period toggle: Week / Month -->
				<div class="sc-period-toggle">
					<button
						class="sc-period-btn"
						:class="period === 'week' && 'sc-period-active'"
						@click="setPeriod('week')">
						Week
					</button>
					<button
						class="sc-period-btn"
						:class="period === 'month' && 'sc-period-active'"
						@click="setPeriod('month')">
						Month
					</button>
				</div>
			</div>

			<!-- Period navigator -->
			<div class="sc-navigator">
				<button class="sc-nav-btn" @click="offset--" v-tooltip.bottom="'Previous'">
					<i class="pi pi-chevron-left" style="font-size: 0.65rem"></i>
				</button>
				<span class="sc-nav-label">{{ periodLabel }}</span>
				<button class="sc-nav-btn" :disabled="offset >= 0" @click="offset++" v-tooltip.bottom="'Next'">
					<i class="pi pi-chevron-right" style="font-size: 0.65rem"></i>
				</button>
			</div>

			<!-- View mode toggle -->
			<div class="sc-view-toggle">
				<button
					class="sc-view-btn"
					:class="viewMode === 'calendar' && 'sc-view-active'"
					@click="viewMode = 'calendar'">
					<i class="pi pi-calendar" style="font-size: 0.75rem"></i>
					Calendar
				</button>
				<button
					class="sc-view-btn"
					:class="viewMode === 'chart' && 'sc-view-active'"
					@click="viewMode = 'chart'">
					<i class="pi pi-chart-bar" style="font-size: 0.75rem"></i>
					Chart
				</button>
			</div>

			<!-- ====== CALENDAR VIEW ====== -->
			<div v-if="viewMode === 'calendar'" ref="scrollContainer" class="sc-scroll">
				<!-- Sub-toggle: Habits / Categories -->
				<div class="sc-sub-toggle">
					<button
						class="sc-sub-btn"
						:class="calendarMode === 'habits' && 'sc-sub-active'"
						@click="calendarMode = 'habits'">
						Habits
					</button>
					<button
						class="sc-sub-btn"
						:class="calendarMode === 'categories' && 'sc-sub-active'"
						@click="calendarMode = 'categories'">
						Categories
					</button>
				</div>

				<div
					v-for="day in calendarDaysSorted"
					:key="day.dateKey"
					class="sc-day"
					:class="{ 'sc-day--gold': day.goalsTotal > 0 && day.goalsCompleted === day.goalsTotal }">
					<!-- Day header -->
					<span class="sc-day-medal-col">
						<span
							v-if="day.goalsTotal > 0 && day.goalsCompleted === day.goalsTotal"
							class="sc-day-medal"
							v-tooltip.right="'All goals completed! 🎉'">🏅</span>
					</span>
					<div class="sc-day-header">
						<span class="sc-day-name">{{ day.dayName }}</span>
						<span class="sc-day-date">{{ day.dateLabel }}</span>
					</div>

					<!-- Habits mode -->
					<template v-if="calendarMode === 'habits'">
						<div v-if="day.groups.length > 0" class="sc-tiles">
							<div
								v-for="g in day.groups"
								:key="g.displayName"
								class="sc-tile"
								v-tooltip.bottom="g.displayName + (g.count > 1 ? ' ×' + g.count : '')">
								<span class="material-symbols-outlined sc-tile-icon">{{ g.icon }}</span>
								<span v-if="g.count > 1" class="sc-tile-badge">{{ g.count }}</span>
							</div>
						</div>
						<span v-else class="sc-day-empty">No habits</span>
					</template>

					<!-- Categories mode -->
					<template v-else>
						<div v-if="day.cats.length > 0" class="sc-day-cats">
							<div
								v-for="cat in day.cats"
								:key="cat.name"
								class="sc-day-cat-pill"
								:class="'sc-day-cat-pill-' + cat.name"
								v-tooltip.bottom="cat.name + ': ' + cat.count + '×'">
								<span class="sc-day-cat-dot" :class="'sc-cat-' + cat.name"></span>
								<span class="sc-day-cat-label">{{ cat.name }}</span>
								<span class="sc-day-cat-count">{{ cat.count }}</span>
							</div>
						</div>
						<span v-else class="sc-day-empty">No habits</span>
					</template>
				</div>

				<!-- Empty state -->
				<div v-if="calendarDays.length === 0" class="sc-empty">
					<span class="sc-empty-emoji">📭</span>
					<p class="sc-empty-text">No data for this period</p>
				</div>
			</div>

			<!-- ====== CHART VIEW ====== -->
			<div v-if="viewMode === 'chart'" ref="scrollContainer" class="sc-scroll">
				<!-- Goals completed tile -->
				<div v-if="dailyGoalsList.length > 0" class="sc-medal-tile">
					<span class="sc-medal-tile-emoji">🏅</span>
					<div class="sc-medal-tile-text">
						<span class="sc-medal-tile-count">{{ goalsCompletedCount }}</span>
						<span class="sc-medal-tile-label">perfect {{ period === 'week' ? 'days' : 'days' }} this {{ period }}</span>
					</div>
				</div>
				<!-- Sub-toggle: Habits / Categories -->
				<div class="sc-sub-toggle">
					<button
						class="sc-sub-btn"
						:class="chartMode === 'habits' && 'sc-sub-active'"
						@click="chartMode = 'habits'">
						Habits
					</button>
					<button
						class="sc-sub-btn"
						:class="chartMode === 'categories' && 'sc-sub-active'"
						@click="chartMode = 'categories'">
						Categories
					</button>
				</div>

				<!-- By habit -->
				<template v-if="chartMode === 'habits'">
					<div
						v-for="h in chartData"
						:key="h.name"
						class="sc-bar-row">
						<div class="sc-bar-tile" v-tooltip.bottom="h.displayName">
							<span class="material-symbols-outlined sc-bar-tile-icon">{{ h.icon }}</span>
						</div>
						<div class="sc-bar-track">
							<div
								class="sc-bar-fill"
								:style="{ width: h.pct + '%' }"></div>
						</div>
						<span class="sc-bar-count">{{ h.count }}×</span>
					</div>
					<div v-if="chartData.length === 0" class="sc-empty">
						<span class="sc-empty-emoji">📭</span>
						<p class="sc-empty-text">No data for this period</p>
					</div>
				</template>

				<!-- By category -->
				<template v-else>
					<div
						v-for="cat in categoryData"
						:key="cat.name"
						class="sc-cat-row">
						<div class="sc-cat-header">
							<span class="sc-cat-dot" :class="'sc-cat-' + cat.name"></span>
							<span class="sc-cat-name">{{ cat.name }}</span>
							<div class="sc-bar-track sc-cat-track">
								<div
									class="sc-bar-fill sc-cat-fill"
									:class="'sc-cat-fill-' + cat.name"
									:style="{ width: cat.pct + '%' }"></div>
							</div>
							<span class="sc-bar-count">{{ cat.count }}×</span>
						</div>
						<div class="sc-cat-habits">
							<div
								v-for="h in cat.habits"
								:key="h.name"
								class="sc-tile"
								v-tooltip.bottom="h.displayName + (h.count > 1 ? ' ×' + h.count : '')">
								<span class="material-symbols-outlined sc-tile-icon">{{ h.icon }}</span>
								<span v-if="h.count > 1" class="sc-tile-badge">{{ h.count }}</span>
							</div>
						</div>
					</div>
					<div v-if="categoryData.length === 0" class="sc-empty">
						<span class="sc-empty-emoji">📭</span>
						<p class="sc-empty-text">No data for this period</p>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useHabbitsStore } from "@/stores/habbits";
import { toDateKey } from "@/utils/timeUtils";

defineProps<{ isActive: boolean }>();

const habbitsStore = useHabbitsStore();
const { userHabbitsList, allHabbitsList, tag_categories, dailyGoalsList } = storeToRefs(habbitsStore);

const period = ref<"week" | "month">("week");
const offset = ref(0); // 0 = bieżący tydzień/miesiąc, -1 = poprzedni itd.
const viewMode = ref<"calendar" | "chart">("calendar");
const chartMode = ref<"habits" | "categories">("habits");
const calendarMode = ref<"habits" | "categories">("habits");
const scrollContainer = ref<HTMLElement | null>(null);

function setPeriod(p: "week" | "month") {
	period.value = p;
	offset.value = 0;
}

// Oblicza zakres dat dla aktualnego okresu + offset
const periodRange = computed(() => {
	const today = new Date();
	if (period.value === "week") {
		// Poniedziałek jako pierwszy dzień tygodnia
		const dow = (today.getDay() + 6) % 7; // 0=pon, 6=nie
		const monday = new Date(today);
		monday.setDate(today.getDate() - dow + offset.value * 7);
		monday.setHours(0, 0, 0, 0);
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		return { start: monday, end: sunday };
	} else {
		const year = today.getFullYear();
		const month = today.getMonth() + offset.value;
		const start = new Date(year, month, 1);
		const end = new Date(year, month + 1, 0);
		return { start, end };
	}
});

// Etykieta tygodnia/miesiąca
const periodLabel = computed(() => {
	const { start, end } = periodRange.value;
	if (period.value === "week") {
		const weekNum = getISOWeek(start);
		const sLabel = String(start.getDate()).padStart(2, "0") + "." + String(start.getMonth() + 1).padStart(2, "0");
		const eLabel = String(end.getDate()).padStart(2, "0") + "." + String(end.getMonth() + 1).padStart(2, "0");
		return `W${weekNum}  ${sLabel} – ${eLabel}`;
	} else {
		return start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
	}
});

function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function resetScroll() {
	nextTick(() => {
		if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
	});
}

onMounted(() => { ensureDataLoaded(); });
watch(periodRange, () => { ensureDataLoaded(); resetScroll(); });
watch(viewMode, () => { resetScroll(); });

async function ensureDataLoaded() {
	const { start, end } = periodRange.value;
	await habbitsStore.getDailyHabbitsInRange(start, end);
}

// Nazwy dni tygodnia
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ========================
// CALENDAR VIEW DATA
// ========================
const calendarDays = computed(() => {
	const { start, end } = periodRange.value;
	const result: Array<{
		dateKey: string;
		dayName: string;
		dateLabel: string;
		groups: Array<{ displayName: string; icon: string; count: number }>;
		cats: Array<{ name: string; count: number }>;
		goalsCompleted: number;
		goalsTotal: number;
	}> = [];

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	const days: Date[] = [];
	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		days.push(new Date(d));
	}

	for (const d of days) {
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		const habbits = entry?.habbits ?? [];

		const grouped = new Map<string, { displayName: string; icon: string; count: number }>();
		for (const h of habbits) {
			const existing = grouped.get(h.name);
			if (existing) { existing.count++; }
			else { grouped.set(h.name, { displayName: h.display_name || h.name, icon: h.icon, count: 1 }); }
		}

		const catMap = new Map<string, number>();
		for (const h of habbits) {
			const cat = getHabitCategory(h.name);
			catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
		}
		const cats = Array.from(catMap.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Postęp celów
		const habitCounts: Record<string, number> = {};
		for (const h of habbits) habitCounts[h.name] = (habitCounts[h.name] ?? 0) + 1;
		const goalCounters: Record<string, number> = {};
		let completedGoals = 0;
		for (const goal of dailyGoalsList.value) {
			goalCounters[goal.name] = (goalCounters[goal.name] ?? 0) + 1;
			if (goalCounters[goal.name] <= (habitCounts[goal.name] ?? 0)) completedGoals++;
		}

		const dTime = d.getTime();
		const dayName =
			dTime === today.getTime() ? "Today" :
			dTime === yesterday.getTime() ? "Yesterday" :
			dayNames[d.getDay()];
		const dateLabel = String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");

		result.push({ dateKey: key, dayName, dateLabel, groups: Array.from(grouped.values()), cats, goalsCompleted: completedGoals, goalsTotal: dailyGoalsList.value.length });
	}
	return result;
});

// Globalna kolejność habitów w kalendarzu: sortowanie wg częstości w całym okresie
const globalHabitOrder = computed(() => {
	const freq = new Map<string, number>();
	for (const day of calendarDays.value) {
		for (const g of day.groups) {
			freq.set(g.name, (freq.get(g.name) ?? 0) + g.count);
		}
	}
	const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
	const order: Record<string, number> = {};
	sorted.forEach((name, i) => { order[name] = i; });
	return order;
});

const calendarDaysSorted = computed(() =>
	calendarDays.value.map((day) => ({
		...day,
		groups: [...day.groups].sort((a, b) => (globalHabitOrder.value[a.name] ?? 999) - (globalHabitOrder.value[b.name] ?? 999)),
	}))
);

// ========================
// CHART VIEW DATA
// ========================
const chartData = computed(() => {
	const { start, end } = periodRange.value;
	const totals = new Map<string, { displayName: string; icon: string; count: number }>();

	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		if (!entry) continue;
		for (const h of entry.habbits) {
			const existing = totals.get(h.name);
			if (existing) { existing.count++; }
			else { totals.set(h.name, { displayName: h.display_name || h.name, icon: h.icon, count: 1 }); }
		}
	}

	const arr = Array.from(totals.entries())
		.map(([name, data]) => ({ name, ...data, pct: 0 }))
		.sort((a, b) => b.count - a.count);
	const max = arr.length > 0 ? arr[0].count : 1;
	for (const item of arr) item.pct = Math.round((item.count / max) * 100);
	return arr;
});

const goalsCompletedCount = computed(() => {
	if (dailyGoalsList.value.length === 0) return 0;
	const { start, end } = periodRange.value;
	let count = 0;
	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		const habbits = entry?.habbits ?? [];
		const habitCounts: Record<string, number> = {};
		for (const h of habbits) habitCounts[h.name] = (habitCounts[h.name] ?? 0) + 1;
		const goalCounters: Record<string, number> = {};
		let completed = 0;
		for (const goal of dailyGoalsList.value) {
			goalCounters[goal.name] = (goalCounters[goal.name] ?? 0) + 1;
			if (goalCounters[goal.name] <= (habitCounts[goal.name] ?? 0)) completed++;
		}
		if (completed === dailyGoalsList.value.length) count++;
	}
	return count;
});

// ========================
// CATEGORY VIEW DATA
// ========================
function getHabitCategory(habitName: string): string {
	const habit = allHabbitsList.value.find((h) => h.name === habitName);
	if (!habit) return "other";
	for (const [cat, tags] of Object.entries(tag_categories.value)) {
		if (habit.tags?.some((t) => tags.includes(t))) return cat;
	}
	return "other";
}

const categoryData = computed(() => {
	const { start, end } = periodRange.value;
	const catTotals = new Map<string, { count: number; habits: Map<string, { name: string; displayName: string; icon: string; count: number }> }>();

	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		if (!entry) continue;
		for (const h of entry.habbits) {
			const cat = getHabitCategory(h.name);
			if (!catTotals.has(cat)) catTotals.set(cat, { count: 0, habits: new Map() });
			const catEntry = catTotals.get(cat)!;
			catEntry.count++;
			const existing = catEntry.habits.get(h.name);
			if (existing) { existing.count++; }
			else { catEntry.habits.set(h.name, { name: h.name, displayName: h.display_name || h.name, icon: h.icon, count: 1 }); }
		}
	}

	const arr = Array.from(catTotals.entries())
		.map(([name, data]) => ({
			name,
			count: data.count,
			habits: Array.from(data.habits.values()).sort((a, b) => b.count - a.count),
			pct: 0,
		}))
		.sort((a, b) => b.count - a.count);
	const max = arr.length > 0 ? arr[0].count : 1;
	for (const item of arr) item.pct = Math.round((item.count / max) * 100);
	return arr;
});
</script>

<style scoped>
/* ====== CARD SHELL ====== */
.sc-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.sc-inner {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}

/* ====== HEADER ====== */
.sc-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 0.6rem;
	flex-shrink: 0;
}
.sc-title {
	font-family: 'Lora', serif;
	font-size: 1rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .sc-title {
	color: var(--p-gray-200);
}

/* Period toggle pills */
.sc-period-toggle {
	display: flex;
	gap: 0.2rem;
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	border-radius: 0.5rem;
	padding: 0.15rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-period-toggle {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-period-btn {
	font-family: 'Lora', serif;
	font-size: 0.7rem;
	font-weight: 500;
	padding: 0.3rem 0.65rem;
	border: none;
	border-radius: 0.4rem;
	background: transparent;
	color: var(--p-gray-500);
	cursor: pointer;
	transition: all 0.2s ease;
}
.sc-period-btn:hover {
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .sc-period-btn:hover {
	color: var(--p-gray-300);
}
.sc-period-active {
	background: white;
	color: var(--p-orange-600) !important;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
:where(.my-app-dark, .my-app-dark *) .sc-period-active {
	background: var(--p-gray-600);
	color: var(--p-orange-400) !important;
}

/* View mode toggle */
.sc-view-toggle {
	display: flex;
	gap: 0.35rem;
	padding-bottom: 0.65rem;
	flex-shrink: 0;
}
.sc-view-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	font-family: 'Lora', serif;
	font-size: 0.7rem;
	font-weight: 500;
	padding: 0.3rem 0.7rem;
	border: 1.5px solid var(--p-orange-200);
	border-radius: 0.5rem;
	background: transparent;
	color: var(--p-gray-500);
	cursor: pointer;
	transition: all 0.2s ease;
}
.sc-view-btn:hover {
	border-color: var(--p-orange-300);
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .sc-view-btn {
	border-color: var(--p-gray-600);
}
:where(.my-app-dark, .my-app-dark *) .sc-view-btn:hover {
	border-color: var(--p-gray-500);
	color: var(--p-gray-300);
}
.sc-view-active {
	border-color: var(--p-orange-400) !important;
	background: color-mix(in srgb, var(--p-orange-50) 60%, transparent);
	color: var(--p-orange-600) !important;
}
:where(.my-app-dark, .my-app-dark *) .sc-view-active {
	border-color: var(--p-orange-500) !important;
	background: color-mix(in srgb, var(--p-orange-900) 30%, transparent);
	color: var(--p-orange-400) !important;
}

/* ====== PERIOD NAVIGATOR ====== */
.sc-navigator {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin-bottom: 0.5rem;
	flex-shrink: 0;
}
.sc-nav-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.6rem;
	height: 1.6rem;
	border-radius: 0.4rem;
	border: 1.5px solid var(--p-orange-200);
	background: transparent;
	color: var(--p-orange-500);
	cursor: pointer;
	transition: all 0.15s ease;
	flex-shrink: 0;
}
.sc-nav-btn:hover:not(:disabled) {
	background: color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	border-color: var(--p-orange-400);
}
.sc-nav-btn:disabled {
	opacity: 0.3;
	cursor: default;
}
:where(.my-app-dark, .my-app-dark *) .sc-nav-btn {
	border-color: var(--p-gray-600);
	color: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .sc-nav-btn:hover:not(:disabled) {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
	border-color: var(--p-gray-500);
}
.sc-nav-label {
	flex: 1;
	text-align: center;
	font-family: 'Lora', serif;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--p-gray-700);
	white-space: nowrap;
}
:where(.my-app-dark, .my-app-dark *) .sc-nav-label {
	color: var(--p-gray-200);
}

/* ====== SCROLLABLE AREA ====== */
.sc-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	scrollbar-width: none;
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
	padding-right: 0.25rem;
}
.sc-scroll::-webkit-scrollbar {
	display: none;
}

/* ====== CALENDAR VIEW — DAY ROW ====== */
.sc-day {
	display: flex;
	align-items: center;
	gap: 0.15rem;
	padding: 0.55rem 0.3rem;
	border-bottom: 1px solid color-mix(in srgb, var(--p-orange-100) 60%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .sc-day {
	border-bottom-color: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-day--gold {
	background: linear-gradient(90deg, color-mix(in srgb, var(--p-yellow-100) 55%, transparent), transparent);
	border-radius: 0.5rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-day--gold {
	background: linear-gradient(90deg, color-mix(in srgb, var(--p-yellow-900) 35%, transparent), transparent);
}
.sc-day-header {
	flex-shrink: 0;
	width: 5.5rem;
	display: flex;
	flex-direction: column;
}
.sc-day-medal-col {
	width: 0.5rem;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 0.1rem;
}
.sc-day-text {
	display: flex;
	flex-direction: column;
}
.sc-day-name {
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	font-weight: 600;
	color: var(--p-gray-700);
	line-height: 1.2;
}
:where(.my-app-dark, .my-app-dark *) .sc-day-name {
	color: var(--p-gray-200);
}
.sc-day-date {
	font-family: 'Lora', serif;
	font-size: 0.65rem;
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .sc-day-date {
	color: var(--p-gray-500);
}
.sc-day-medal {
	font-size: 0.75rem;
	line-height: 1;
}
.sc-day-empty {
	font-family: 'Lora', serif;
	font-size: 0.72rem;
	font-style: italic;
	color: var(--p-gray-300);
}
:where(.my-app-dark, .my-app-dark *) .sc-day-empty {
	color: var(--p-gray-600);
}

/* Habit tiles grid */
.sc-tiles {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
}
.sc-tile {
	position: relative;
	width: 2rem;
	height: 2rem;
	border-radius: 0.55rem;
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: default;
	transition: transform 0.15s ease;
}
.sc-tile:hover {
	transform: scale(1.1);
}
:where(.my-app-dark, .my-app-dark *) .sc-tile {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-tile-icon {
	font-size: 1.1rem;
	line-height: 1;
}
.sc-tile-badge {
	position: absolute;
	top: -0.25rem;
	right: -0.25rem;
	min-width: 0.95rem;
	height: 0.95rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: var(--p-orange-500);
	color: white;
	font-family: 'Lora', serif;
	font-size: 0.5rem;
	font-weight: 700;
	line-height: 1;
	padding: 0 0.15rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-tile-badge {
	background: var(--p-orange-600);
}

/* ====== CHART VIEW — BAR ROWS ====== */
.sc-bar-row {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.45rem 0.3rem;
}
.sc-bar-tile {
	width: 2rem;
	height: 2rem;
	border-radius: 0.55rem;
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	cursor: default;
}
:where(.my-app-dark, .my-app-dark *) .sc-bar-tile {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-bar-tile-icon {
	font-size: 1.1rem;
	line-height: 1;
}
.sc-bar-track {
	flex: 1;
	height: 0.55rem;
	border-radius: 0.3rem;
	background: color-mix(in srgb, var(--p-orange-100) 40%, transparent);
	overflow: hidden;
}
:where(.my-app-dark, .my-app-dark *) .sc-bar-track {
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
}
.sc-bar-fill {
	height: 100%;
	border-radius: 0.3rem;
	background: linear-gradient(90deg, var(--p-orange-400), var(--p-orange-500));
	transition: width 0.5s ease;
	min-width: 0.3rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-bar-fill {
	background: linear-gradient(90deg, var(--p-orange-500), var(--p-orange-600));
}
.sc-bar-count {
	font-family: 'Lora', serif;
	font-size: 0.72rem;
	font-weight: 600;
	color: var(--p-gray-600);
	min-width: 2rem;
	text-align: right;
	flex-shrink: 0;
}
:where(.my-app-dark, .my-app-dark *) .sc-bar-count {
	color: var(--p-gray-400);
}

/* ====== EMPTY STATE ====== */
.sc-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2.5rem 1rem;
	text-align: center;
}
.sc-empty-emoji {
	font-size: 1.5rem;
	margin-bottom: 0.35rem;
	opacity: 0.5;
}
.sc-empty-text {
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	color: var(--p-gray-400);
	margin: 0;
	font-style: italic;
}
:where(.my-app-dark, .my-app-dark *) .sc-empty-text {
	color: var(--p-gray-500);
}

/* ====== GOALS MEDAL TILE ====== */
.sc-medal-tile {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	margin-bottom: 0.75rem;
	background: linear-gradient(135deg, #fef9c3, #fde68a);
	border: 1px solid #fcd34d;
	border-radius: 1rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-medal-tile {
	background: linear-gradient(135deg, color-mix(in srgb, #92400e 40%, transparent), color-mix(in srgb, #78350f 50%, transparent));
	border-color: #b45309;
}
.sc-medal-tile-emoji {
	font-size: 2rem;
	line-height: 1;
}
.sc-medal-tile-text {
	display: flex;
	flex-direction: column;
}
.sc-medal-tile-count {
	font-family: 'Lora', serif;
	font-size: 1.6rem;
	font-weight: 700;
	color: #92400e;
	line-height: 1;
}
:where(.my-app-dark, .my-app-dark *) .sc-medal-tile-count {
	color: #fde68a;
}
.sc-medal-tile-label {
	font-family: 'Lora', serif;
	font-size: 0.7rem;
	color: #b45309;
	margin-top: 0.1rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-medal-tile-label {
	color: #fcd34d;
}

/* ====== CHART SUB-TOGGLE ====== */
.sc-sub-toggle {
	display: flex;
	gap: 0.2rem;
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	border-radius: 0.5rem;
	padding: 0.15rem;
	margin-bottom: 0.5rem;
	align-self: flex-start;
	flex-shrink: 0;
}
:where(.my-app-dark, .my-app-dark *) .sc-sub-toggle {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-sub-btn {
	font-family: 'Lora', serif;
	font-size: 0.68rem;
	font-weight: 500;
	padding: 0.25rem 0.6rem;
	border: none;
	border-radius: 0.35rem;
	background: transparent;
	color: var(--p-gray-500);
	cursor: pointer;
	transition: all 0.2s ease;
}
.sc-sub-btn:hover { color: var(--p-gray-700); }
:where(.my-app-dark, .my-app-dark *) .sc-sub-btn:hover { color: var(--p-gray-300); }
.sc-sub-active {
	background: white;
	color: var(--p-orange-600) !important;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
:where(.my-app-dark, .my-app-dark *) .sc-sub-active {
	background: var(--p-gray-600);
	color: var(--p-orange-400) !important;
}

/* ====== CATEGORY ROWS ====== */
.sc-cat-row {
	padding: 0.55rem 0.3rem;
	border-bottom: 1px solid color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}
:where(.my-app-dark, .my-app-dark *) .sc-cat-row {
	border-bottom-color: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-cat-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.sc-cat-dot {
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	flex-shrink: 0;
	background: var(--p-orange-400);
}
.sc-cat-dot.sc-cat-sport   { background: var(--p-green-400); }
.sc-cat-dot.sc-cat-health  { background: var(--p-red-400); }
.sc-cat-dot.sc-cat-work    { background: var(--p-blue-400); }
.sc-cat-dot.sc-cat-learning{ background: var(--p-purple-400); }
.sc-cat-dot.sc-cat-relax   { background: var(--p-teal-400); }
.sc-cat-dot.sc-cat-negative{ background: var(--p-gray-400); }

.sc-cat-name {
	font-family: 'Lora', serif;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--p-gray-700);
	text-transform: capitalize;
	min-width: 4rem;
	flex-shrink: 0;
}
:where(.my-app-dark, .my-app-dark *) .sc-cat-name { color: var(--p-gray-200); }

.sc-cat-track { margin: 0; }

/* Category-specific fill colors */
.sc-cat-fill { background: linear-gradient(90deg, var(--p-orange-400), var(--p-orange-500)); }
.sc-cat-fill-sport    { background: linear-gradient(90deg, var(--p-green-300), var(--p-green-500)); }
.sc-cat-fill-health   { background: linear-gradient(90deg, var(--p-red-300), var(--p-red-500)); }
.sc-cat-fill-work     { background: linear-gradient(90deg, var(--p-blue-300), var(--p-blue-500)); }
.sc-cat-fill-learning { background: linear-gradient(90deg, var(--p-purple-300), var(--p-purple-500)); }
.sc-cat-fill-relax    { background: linear-gradient(90deg, var(--p-teal-300), var(--p-teal-500)); }
.sc-cat-fill-negative { background: linear-gradient(90deg, var(--p-gray-300), var(--p-gray-500)); }

.sc-cat-habits {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	padding-left: 1.05rem;
}

/* ====== CALENDAR CATEGORY PILLS ====== */
.sc-day-cats {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
}
.sc-day-cat-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.18rem 0.45rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--p-orange-100) 55%, transparent);
	cursor: default;
	transition: transform 0.15s ease;
}
.sc-day-cat-pill:hover { transform: scale(1.05); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill {
	background: color-mix(in srgb, var(--p-gray-700) 55%, transparent);
}
.sc-day-cat-pill-sport    { background: color-mix(in srgb, var(--p-green-100) 55%, transparent); }
.sc-day-cat-pill-health   { background: color-mix(in srgb, var(--p-red-100) 55%, transparent); }
.sc-day-cat-pill-work     { background: color-mix(in srgb, var(--p-blue-100) 55%, transparent); }
.sc-day-cat-pill-learning { background: color-mix(in srgb, var(--p-purple-100) 55%, transparent); }
.sc-day-cat-pill-relax    { background: color-mix(in srgb, var(--p-teal-100) 55%, transparent); }
.sc-day-cat-pill-negative { background: color-mix(in srgb, var(--p-gray-100) 55%, transparent); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill-sport    { background: color-mix(in srgb, var(--p-green-900) 35%, transparent); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill-health   { background: color-mix(in srgb, var(--p-red-900) 35%, transparent); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill-work     { background: color-mix(in srgb, var(--p-blue-900) 35%, transparent); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill-learning { background: color-mix(in srgb, var(--p-purple-900) 35%, transparent); }
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-pill-relax    { background: color-mix(in srgb, var(--p-teal-900) 35%, transparent); }
.sc-day-cat-dot {
	width: 0.45rem;
	height: 0.45rem;
	border-radius: 50%;
	flex-shrink: 0;
	background: var(--p-orange-400);
}
.sc-day-cat-label {
	font-family: 'Lora', serif;
	font-size: 0.62rem;
	font-weight: 600;
	text-transform: capitalize;
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-label { color: var(--p-gray-200); }
.sc-day-cat-count {
	font-family: 'Lora', serif;
	font-size: 0.6rem;
	font-weight: 700;
	color: var(--p-gray-500);
}
:where(.my-app-dark, .my-app-dark *) .sc-day-cat-count { color: var(--p-gray-400); }
</style>
