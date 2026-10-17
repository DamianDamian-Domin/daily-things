import { addDays, fromDateKey, toDateKey, type DateKey } from "@/utils/date";
import { longestRun } from "@/utils/streak";
import type { PaletteKey } from "@/utils/pixelIcons";
import { defineLocalizedField } from "@/i18n";
import { ACHIEVEMENTS_PL } from "@/i18n/messages/achievements";

// ==========================================================================
// Odznaki (ordery). Czysta logika: dostaje podsumowanie wczytanej historii
// i mówi, co jest zdobyte oraz ile brakuje do kolejnych. Zdobyte odznaki
// zapisujemy w users/{uid}.achievements, więc nie znikają, gdy starsza
// historia nie jest wczytana.
// ==========================================================================

export interface DaySummary {
	key: DateKey;
	perfect: boolean;
	logs: Array<{ at?: number; negative: boolean; category: string | null }>;
}

export interface AchievementInput {
	days: DaySummary[];
	currentStreak: number;
	goalNames: number; // ile różnych celów dziennych
	customHabits: number;
	friends: number;
}

export interface AchievementMetrics {
	checkIns: number;
	loggedDays: number;
	perfectDays: number;
	bestStreak: number;
	currentStreak: number;
	earlyCheckIns: number;
	lateCheckIns: number;
	categories: number;
	perfectWeek: boolean;
	perfectWeekend: boolean;
	comeback: boolean;
	goalNames: number;
	customHabits: number;
	friends: number;
}

export interface AchievementDef {
	id: string;
	title: string;
	description: string;
	icon: string;
	palette: PaletteKey;
	target: number;
	value: (m: AchievementMetrics) => number;
}

const flag = (b: boolean) => (b ? 1 : 0);

export const ACHIEVEMENTS: AchievementDef[] = [
	{
		id: "first_step",
		title: "First step",
		description: "Log your very first habit",
		icon: "potted_plant",
		palette: "green",
		target: 1,
		value: (m) => m.checkIns,
	},
	{
		id: "goal_setter",
		title: "Goal setter",
		description: "Choose your first daily goal",
		icon: "flag",
		palette: "yellow",
		target: 1,
		value: (m) => m.goalNames,
	},
	{
		id: "perfect_day",
		title: "Perfect day",
		description: "Finish all your goals in one day",
		icon: "star_shine",
		palette: "yellow",
		target: 1,
		value: (m) => m.perfectDays,
	},
	{
		id: "streak_3",
		title: "Warming up",
		description: "Keep a 3-day streak",
		icon: "local_fire_department",
		palette: "orange",
		target: 3,
		value: (m) => m.bestStreak,
	},
	{
		id: "streak_7",
		title: "One week strong",
		description: "Keep a 7-day streak",
		icon: "local_fire_department",
		palette: "red",
		target: 7,
		value: (m) => m.bestStreak,
	},
	{
		id: "streak_30",
		title: "Unstoppable",
		description: "Keep a 30-day streak",
		icon: "rocket_launch",
		palette: "purple",
		target: 30,
		value: (m) => m.bestStreak,
	},
	{
		id: "perfect_week",
		title: "Perfect week",
		description: "Every goal, Monday to Sunday",
		icon: "trophy",
		palette: "yellow",
		target: 1,
		value: (m) => flag(m.perfectWeek),
	},
	{
		id: "weekend",
		title: "Weekend warrior",
		description: "All goals done on Saturday and Sunday",
		icon: "celebration",
		palette: "orange",
		target: 1,
		value: (m) => flag(m.perfectWeekend),
	},
	{
		id: "perfect_10",
		title: "Ten out of ten",
		description: "Collect 10 perfect days",
		icon: "done_outline",
		palette: "teal",
		target: 10,
		value: (m) => m.perfectDays,
	},
	{
		id: "checkins_50",
		title: "Half a hundred",
		description: "Log 50 good habits",
		icon: "check_circle",
		palette: "green",
		target: 50,
		value: (m) => m.checkIns,
	},
	{
		id: "checkins_250",
		title: "Habit machine",
		description: "Log 250 good habits",
		icon: "diamond",
		palette: "blue",
		target: 250,
		value: (m) => m.checkIns,
	},
	{
		id: "early_bird",
		title: "Early bird",
		description: "Log 5 habits before 8 am",
		icon: "wb_twilight",
		palette: "yellow",
		target: 5,
		value: (m) => m.earlyCheckIns,
	},
	{
		id: "night_owl",
		title: "Night owl",
		description: "Log 5 habits after 10 pm",
		icon: "nightlight",
		palette: "indigo",
		target: 5,
		value: (m) => m.lateCheckIns,
	},
	{
		id: "explorer",
		title: "Explorer",
		description: "Try habits from 5 different areas",
		icon: "explore",
		palette: "teal",
		target: 5,
		value: (m) => m.categories,
	},
	{
		id: "creator",
		title: "Made it mine",
		description: "Create your own habit",
		icon: "palette",
		palette: "pink",
		target: 1,
		value: (m) => m.customHabits,
	},
	{
		id: "comeback",
		title: "Welcome back",
		description: "Pick things up again after a break",
		icon: "favorite",
		palette: "red",
		target: 1,
		value: (m) => flag(m.comeback),
	},
	{
		id: "friends",
		title: "Better together",
		description: "Add your first friend",
		icon: "group",
		palette: "pink",
		target: 1,
		value: (m) => m.friends,
	},
];

// Nazwy i opisy idą za wybranym językiem (gettery), więc odznaki u znajomych
// i w toastach tłumaczą się same
for (const def of ACHIEVEMENTS) {
	defineLocalizedField(def, "title", ACHIEVEMENTS_PL[def.id]?.title);
	defineLocalizedField(def, "description", ACHIEVEMENTS_PL[def.id]?.description);
}

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

const EARLY_FROM = 4;
const EARLY_UNTIL = 8;
const LATE_FROM = 22;
const LATE_UNTIL = 3;
const COMEBACK_GAP_DAYS = 4; // 3+ puste dni między wpisami

export function collectMetrics(input: AchievementInput): AchievementMetrics {
	let checkIns = 0;
	let early = 0;
	let late = 0;
	const categories = new Set<string>();
	const logged: DateKey[] = [];
	const perfect = new Set<DateKey>();

	for (const day of input.days) {
		if (day.perfect) perfect.add(day.key);
		if (day.logs.length) logged.push(day.key);
		for (const log of day.logs) {
			if (log.negative) continue;
			checkIns++;
			if (log.category) categories.add(log.category);
			if (log.at) {
				const hour = new Date(log.at).getHours();
				if (hour >= EARLY_FROM && hour < EARLY_UNTIL) early++;
				if (hour >= LATE_FROM || hour < LATE_UNTIL) late++;
			}
		}
	}
	logged.sort();

	let comeback = false;
	for (let i = 1; i < logged.length && !comeback; i++) {
		const gap = Math.round(
			(fromDateKey(logged[i]).getTime() - fromDateKey(logged[i - 1]).getTime()) / 86_400_000,
		);
		comeback = gap >= COMEBACK_GAP_DAYS;
	}

	const isPerfect = (d: Date) => perfect.has(toDateKey(d));
	let perfectWeek = false;
	let perfectWeekend = false;
	for (const key of perfect) {
		const date = fromDateKey(key);
		const weekday = date.getDay();
		if (weekday === 6 && isPerfect(addDays(date, 1))) perfectWeekend = true;
		if (weekday === 1 && [1, 2, 3, 4, 5, 6].every((i) => isPerfect(addDays(date, i)))) {
			perfectWeek = true;
		}
	}

	return {
		checkIns,
		loggedDays: logged.length,
		perfectDays: perfect.size,
		bestStreak: Math.max(longestRun(logged), input.currentStreak),
		currentStreak: input.currentStreak,
		earlyCheckIns: early,
		lateCheckIns: late,
		categories: categories.size,
		perfectWeek,
		perfectWeekend,
		comeback,
		goalNames: input.goalNames,
		customHabits: input.customHabits,
		friends: input.friends,
	};
}

export function earnedIds(metrics: AchievementMetrics): string[] {
	return ACHIEVEMENTS.filter((a) => a.value(metrics) >= a.target).map((a) => a.id);
}

export function progressOf(def: AchievementDef, metrics: AchievementMetrics) {
	const current = Math.min(def.value(metrics), def.target);
	return { current, target: def.target, pct: Math.round((current / def.target) * 100) };
}
