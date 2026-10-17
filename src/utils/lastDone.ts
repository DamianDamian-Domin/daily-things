// „Kiedy ostatnio…?” — historia pojedynczych habitów (np. mycie lodówki).
// Czysta logika bez Firebase, żeby dało się ją testować.
import type { DayEntry } from "@/libs/types";
import { fromDateKey, type DateKey } from "@/utils/date";
import { insightsMessages as m } from "@/i18n/messages/insights";

export interface HabitHistory {
	name: string;
	// Dni, w których habit był zapisany — od najnowszego
	dates: DateKey[];
	// Wszystkie odhaczenia (habit 3× dziennie liczy się 3 razy)
	count: number;
	// Notatki z odhaczeń, po dniach (tylko dni, w których jakaś była)
	notes: Record<DateKey, string[]>;
}

export function buildHabitHistory(days: Iterable<DayEntry>): Map<string, HabitHistory> {
	const map = new Map<string, HabitHistory>();
	for (const day of days) {
		const seen = new Set<string>();
		for (const log of day.habits) {
			let entry = map.get(log.name);
			if (!entry) {
				entry = { name: log.name, dates: [], count: 0, notes: {} };
				map.set(log.name, entry);
			}
			entry.count++;
			const note = log.note?.trim();
			if (note) (entry.notes[day.date] ??= []).push(note);
			if (!seen.has(log.name)) {
				seen.add(log.name);
				entry.dates.push(day.date);
			}
		}
	}
	for (const entry of map.values()) entry.dates.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
	return map;
}

// Notatka pasująca do wyszukiwania, od najnowszego dnia („filtr” → lodówka)
export function findNote(
	history: HabitHistory,
	normalizedQuery: string,
	normalize: (text: string) => string,
): string | null {
	if (!normalizedQuery) return null;
	for (const date of history.dates) {
		const hit = history.notes[date]?.find((n) => normalize(n).includes(normalizedQuery));
		if (hit) return hit;
	}
	return null;
}

// Liczba pełnych dni między datami (Math.round chroni przed zmianą czasu)
export function daysBetween(from: DateKey, to: DateKey): number {
	return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000);
}

export function agoLabel(days: number): string {
	if (days <= 0) return m.agoToday;
	if (days === 1) return m.agoYesterday;
	if (days < 14) return m.agoDays(days);
	if (days < 60) return m.agoWeeks(Math.round(days / 7));
	if (days < 365) return m.agoMonths(Math.round(days / 30.44));
	return m.agoYears(Math.floor(days / 365));
}

// Krótka wersja na plakietkę: „dziś”, „3d”, „5w”, „4mo”, „1y”
export function agoShort(days: number): string {
	if (days <= 0) return m.agoToday;
	if (days < 14) return m.shortDays(days);
	if (days < 60) return m.shortWeeks(Math.round(days / 7));
	if (days < 365) return m.shortMonths(Math.round(days / 30.44));
	return m.shortYears(Math.floor(days / 365));
}

// Średni odstęp między kolejnymi dniami (potrzeba co najmniej 2 dni)
export function averageGap(datesDesc: DateKey[]): number | null {
	if (datesDesc.length < 2) return null;
	const span = daysBetween(datesDesc[datesDesc.length - 1], datesDesc[0]);
	return span / (datesDesc.length - 1);
}

export type Freshness = "fresh" | "due" | "overdue";

// Czy pora znowu? Porównujemy z własnym rytmem użytkownika: lodówka myta
// co ~30 dni jest „na czasie” po 10 dniach, ale „zaległa” po 50.
export function freshness(daysAgo: number, gap: number | null): Freshness {
	if (gap === null || gap < 1) return "fresh";
	if (daysAgo > gap * 1.5) return "overdue";
	if (daysAgo >= gap) return "due";
	return "fresh";
}

export function rhythmLabel(gap: number | null): string | null {
	if (gap === null) return null;
	if (gap < 1.5) return m.rhythmDaily;
	if (gap < 10) return m.rhythmDays(Math.round(gap));
	if (gap < 45) return m.rhythmWeeks(Math.round(gap / 7));
	return m.rhythmMonths(Math.round(gap / 30.44));
}
