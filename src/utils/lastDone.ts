// „Kiedy ostatnio…?” — historia pojedynczych habitów (np. mycie lodówki).
// Czysta logika bez Firebase, żeby dało się ją testować.
import type { DayEntry } from "@/libs/types";
import { fromDateKey, type DateKey } from "@/utils/date";

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
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 14) return `${days} days ago`;
	if (days < 60) return `${Math.round(days / 7)} weeks ago`;
	if (days < 365) return `${Math.round(days / 30.44)} months ago`;
	const years = Math.floor(days / 365);
	return years === 1 ? "over a year ago" : `over ${years} years ago`;
}

// Krótka wersja na plakietkę: „dziś”, „3d”, „5w”, „4mo”, „1y”
export function agoShort(days: number): string {
	if (days <= 0) return "today";
	if (days < 14) return `${days}d`;
	if (days < 60) return `${Math.round(days / 7)}w`;
	if (days < 365) return `${Math.round(days / 30.44)}mo`;
	return `${Math.floor(days / 365)}y`;
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
	if (gap < 1.5) return "almost every day";
	if (gap < 10) return `about every ${Math.round(gap)} days`;
	if (gap < 45) return `about every ${Math.round(gap / 7)} ${Math.round(gap / 7) === 1 ? "week" : "weeks"}`;
	const months = Math.round(gap / 30.44);
	return `about every ${months} ${months === 1 ? "month" : "months"}`;
}
