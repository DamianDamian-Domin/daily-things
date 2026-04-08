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
						@click="period = 'week'">
						Week
					</button>
					<button
						class="sc-period-btn"
						:class="period === 'month' && 'sc-period-active'"
						@click="period = 'month'">
						Month
					</button>
				</div>
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
				<div
					v-for="day in calendarDays"
					:key="day.dateKey"
					class="sc-day">
					<!-- Day header -->
					<div class="sc-day-header">
						<span class="sc-day-name">{{ day.dayName }}</span>
						<span class="sc-day-date">{{ day.dateLabel }}</span>
					</div>
					<!-- Habit tiles -->
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
				</div>

				<!-- Empty state -->
				<div v-if="calendarDays.length === 0" class="sc-empty">
					<span class="sc-empty-emoji">📭</span>
					<p class="sc-empty-text">No data for this period</p>
				</div>
			</div>

			<!-- ====== CHART VIEW ====== -->
			<div v-if="viewMode === 'chart'" ref="scrollContainer" class="sc-scroll">
				<div
					v-for="h in chartData"
					:key="h.name"
					class="sc-bar-row">
					<!-- Habit tile -->
					<div class="sc-bar-tile" v-tooltip.bottom="h.displayName">
						<span class="material-symbols-outlined sc-bar-tile-icon">{{ h.icon }}</span>
					</div>
					<!-- Bar + count -->
					<div class="sc-bar-track">
						<div
							class="sc-bar-fill"
							:style="{ width: h.pct + '%' }"></div>
					</div>
					<span class="sc-bar-count">{{ h.count }}×</span>
				</div>

				<!-- Empty state -->
				<div v-if="chartData.length === 0" class="sc-empty">
					<span class="sc-empty-emoji">📭</span>
					<p class="sc-empty-text">No data for this period</p>
				</div>
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
const { userHabbitsList } = storeToRefs(habbitsStore);

const period = ref<"week" | "month">("week");
const viewMode = ref<"calendar" | "chart">("calendar");
const scrollContainer = ref<HTMLElement | null>(null);

function resetScroll() {
	nextTick(() => {
		if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
	});
}

// Upewnij się, że dane są załadowane dla wybranego zakresu
onMounted(() => {
	ensureDataLoaded();
});

watch(period, () => {
	ensureDataLoaded();
	resetScroll();
});

watch(viewMode, () => {
	resetScroll();
});

async function ensureDataLoaded() {
	const end = new Date();
	const start = new Date();
	const daysBack = period.value === "week" ? 7 : 30;
	start.setDate(start.getDate() - daysBack);
	await habbitsStore.getDailyHabbitsInRange(start, end);
}

// Nazwy dni tygodnia
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ========================
// CALENDAR VIEW DATA
// ========================
const calendarDays = computed(() => {
	const daysBack = period.value === "week" ? 7 : 30;
	const result: Array<{
		dateKey: string;
		dayName: string;
		dateLabel: string;
		groups: Array<{ displayName: string; icon: string; count: number }>;
	}> = [];

	for (let i = 0; i < daysBack; i++) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		const habbits = entry?.habbits ?? [];

		// Grupowanie habbitów po nazwie
		const grouped = new Map<string, { displayName: string; icon: string; count: number }>();
		for (const h of habbits) {
			const existing = grouped.get(h.name);
			if (existing) {
				existing.count++;
			} else {
				grouped.set(h.name, {
					displayName: h.display_name || h.name,
					icon: h.icon,
					count: 1,
				});
			}
		}

		const dayName = i === 0 ? "Today" : i === 1 ? "Yesterday" : dayNames[d.getDay()];
		const dateLabel = String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");

		result.push({
			dateKey: key,
			dayName,
			dateLabel,
			groups: Array.from(grouped.values()),
		});
	}
	return result;
});

// ========================
// CHART VIEW DATA
// ========================
const chartData = computed(() => {
	const daysBack = period.value === "week" ? 7 : 30;
	const totals = new Map<string, { displayName: string; icon: string; count: number }>();

	for (let i = 0; i < daysBack; i++) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		if (!entry) continue;
		for (const h of entry.habbits) {
			const existing = totals.get(h.name);
			if (existing) {
				existing.count++;
			} else {
				totals.set(h.name, {
					displayName: h.display_name || h.name,
					icon: h.icon,
					count: 1,
				});
			}
		}
	}

	const arr = Array.from(totals.entries())
		.map(([name, data]) => ({ name, ...data, pct: 0 }))
		.sort((a, b) => b.count - a.count);

	const max = arr.length > 0 ? arr[0].count : 1;
	for (const item of arr) {
		item.pct = Math.round((item.count / max) * 100);
	}

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
	gap: 0.65rem;
	padding: 0.55rem 0.3rem;
	border-bottom: 1px solid color-mix(in srgb, var(--p-orange-100) 60%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .sc-day {
	border-bottom-color: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}
.sc-day-header {
	flex-shrink: 0;
	width: 5.5rem;
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
</style>
