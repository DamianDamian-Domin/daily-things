import { computed, watch, type Ref } from "vue";
import type { GroupedHabit, Habit } from "@/libs/types";
import { useHabitsStore } from "@/stores/habits";
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
import { CUSTOM_CATEGORY, isNegative, superCategoryOf } from "@/utils/habitCatalog";
import { PALETTES, type PaletteKey } from "@/utils/pixelIcons";

export type StatsPeriod = "week" | "month";

export interface StatsDay {
	key: string;
	dateObj: Date;
	date: string;
	name: string;
	dayNum: number;
	future: boolean;
	isToday: boolean;
	total: number;
	perfect: boolean;
	groups: GroupedHabit[];
}

export interface StatsMonthDay extends StatsDay {
	level: number;
}

export interface StatsSummary {
	total: number;
	positive: number;
	perfectDays: number;
	elapsedDays: number;
}

export interface StatsTopHabit extends GroupedHabit {
	pct: number;
}

export interface StatsCategoryShare {
	key: string;
	label: string;
	icon: string;
	palette: PaletteKey;
	color: string;
	count: number;
	pct: number;
}

// Wszystkie wyliczenia statystyk dla wybranego okresu (tydzień/miesiąc + przesunięcie)
export function useStatsData(period: Ref<StatsPeriod>, offset: Ref<number>) {
	const habitsStore = useHabitsStore();

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
		[range, () => habitsStore.dailyGoalsList],
		() => habitsStore.ensureRange(range.value.start, range.value.end),
		{ immediate: true },
	);

	// ==========================================
	// DANE DNI
	// ==========================================
	const todayKey = computed(() => habitsStore.todayKey);

	const days = computed<StatsDay[]>(() =>
		daysInRange(range.value.start, range.value.end).map((date) => {
			const key = toDateKey(date);
			const logs = habitsStore.logsOn(key);
			const goals = habitsStore.dayGoalsProgress(key);
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
				groups: habitsStore.groupLogs(logs).sort((a, b) => b.count - a.count),
			};
		}),
	);

	// Przyszłe dni bieżącego tygodnia tylko zajmowałyby miejsce
	const weekDays = computed(() => days.value.filter((d) => !d.future).reverse());

	const monthDays = computed<StatsMonthDay[]>(() => {
		const max = Math.max(1, ...days.value.map((d) => d.total));
		return days.value.map((d) => ({
			...d,
			level: d.total === 0 ? 0 : Math.min(4, Math.ceil((d.total / max) * 4)),
		}));
	});
	const monthLeadingBlanks = computed(() => (range.value.start.getDay() + 6) % 7);

	const summary = computed<StatsSummary>(() => {
		let total = 0;
		let positive = 0;
		let perfectDays = 0;
		let elapsedDays = 0;
		for (const d of days.value) {
			if (d.future) continue;
			elapsedDays++;
			total += d.total;
			if (d.perfect) perfectDays++;
			for (const g of d.groups) if (!isNegative(g.habit)) positive += g.count;
		}
		return { total, positive, perfectDays, elapsedDays };
	});

	// ==========================================
	// TOP I KATEGORIE
	// ==========================================
	const totals = computed(() => {
		const map = new Map<string, { name: string; habit: Habit; count: number }>();
		for (const d of days.value) {
			for (const g of d.groups) {
				const entry = map.get(g.name);
				if (entry) entry.count += g.count;
				else map.set(g.name, { name: g.name, habit: g.habit, count: g.count });
			}
		}
		return [...map.values()].sort((a, b) => b.count - a.count);
	});

	const topHabits = computed<StatsTopHabit[]>(() => {
		const top = totals.value.slice(0, 8);
		const max = top[0]?.count ?? 1;
		return top.map((t) => ({ ...t, pct: Math.max(6, Math.round((t.count / max) * 100)) }));
	});

	const categoryShares = computed<StatsCategoryShare[]>(() => {
		const map = new Map<string, Omit<StatsCategoryShare, "pct">>();
		let sum = 0;
		for (const t of totals.value) {
			if (isNegative(t.habit)) continue;
			const cat = superCategoryOf(t.habit) ?? CUSTOM_CATEGORY;
			const entry = map.get(cat.key);
			if (entry) entry.count += t.count;
			else
				map.set(cat.key, {
					key: cat.key,
					label: cat.label,
					icon: cat.icon,
					palette: cat.palette,
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

	return {
		range,
		periodLabel,
		days,
		weekDays,
		monthDays,
		monthLeadingBlanks,
		summary,
		topHabits,
		categoryShares,
	};
}
