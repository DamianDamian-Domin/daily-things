import type { GoalRef, GoalSchedule } from "@/libs/types";
import { addDays, fromDateKey, startOfWeek, toDateKey, type DateKey } from "@/utils/date";

// ==========================================================================
// Rytm celu: codziennie (brak `schedule`), w wybrane dni tygodnia albo
// N× w tygodniu (dowolne dni). Tydzień zaczyna się w poniedziałek.
// ==========================================================================

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"];
export const MAX_WEEKLY_TIMES = 6;

// 0 = poniedziałek … 6 = niedziela
export function weekdayIndex(key: DateKey): number {
	return (fromDateKey(key).getDay() + 6) % 7;
}

// Zapisany rytm może być niepełny (stare dane, ręczna edycja) — normalizujemy
export function normalizeSchedule(schedule: unknown): GoalSchedule | undefined {
	const s = schedule as GoalSchedule | undefined;
	if (s?.kind === "days" && Array.isArray(s.days)) {
		const days = [...new Set(s.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
		// Wszystkie dni (albo żaden) to po prostu „codziennie”
		return days.length > 0 && days.length < 7 ? { kind: "days", days } : undefined;
	}
	if (s?.kind === "weekly" && Number.isFinite(s.times)) {
		return { kind: "weekly", times: Math.min(MAX_WEEKLY_TIMES, Math.max(1, Math.round(s.times))) };
	}
	return undefined;
}

export function isWeekly(goal: GoalRef): boolean {
	return normalizeSchedule(goal.schedule)?.kind === "weekly";
}

// Czy cel dzienny (lub w wybrane dni) obowiązuje tego dnia. Cele tygodniowe
// nie mają „swoich” dni — liczy się cały tydzień.
export function isDueOn(goal: GoalRef, key: DateKey): boolean {
	const s = normalizeSchedule(goal.schedule);
	if (!s) return true;
	if (s.kind === "days") return s.days.includes(weekdayIndex(key));
	return false;
}

// Dzień odpoczynku: są cele, ale żaden nie obowiązuje tego dnia i nie ma celu
// tygodniowego. Taki dzień bez wpisów nie zrywa serii.
export function isRestDay(goals: GoalRef[], key: DateKey): boolean {
	return (
		goals.length > 0 && goals.every((g) => normalizeSchedule(g.schedule)?.kind === "days" && !isDueOn(g, key))
	);
}

// Dni tygodnia (poniedziałek–niedziela), w którym leży `key`
export function weekKeys(key: DateKey): DateKey[] {
	const start = startOfWeek(fromDateKey(key));
	return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

export function scheduleLabel(schedule: GoalSchedule | undefined): string {
	const s = normalizeSchedule(schedule);
	if (!s) return "Every day";
	if (s.kind === "weekly") return `${s.times}× a week`;
	const days = s.days;
	if (days.join() === "0,1,2,3,4") return "Weekdays";
	if (days.join() === "5,6") return "Weekends";
	return days.map((d) => WEEKDAY_SHORT[d]).join(" · ");
}
