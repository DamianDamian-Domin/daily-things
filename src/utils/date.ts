// Wszystkie klucze dni liczymy w LOKALNEJ strefie czasowej użytkownika.
// Wcześniej używaliśmy UTC, przez co np. w Polsce habit dodany o 0:30
// trafiał do poprzedniego dnia, a w USA wieczorem — do następnego.

export type DateKey = string; // YYYY-MM-DD

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): DateKey {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function startOfDay(date: Date = new Date()): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function todayKey(): DateKey {
	return toDateKey(new Date());
}

export function isSameDay(a: Date, b: Date): boolean {
	return toDateKey(a) === toDateKey(b);
}

// Klucz miesiąca YYYY-MM — jednostka, w której doładowujemy historię
export function monthKeyOf(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthBounds(year: number, monthIndex: number) {
	const start = new Date(year, monthIndex, 1);
	const end = new Date(year, monthIndex + 1, 0);
	return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
}

// Wszystkie miesiące (YYYY-MM) pokrywające zakres dat
export function monthsInRange(start: Date, end: Date): Array<[number, number]> {
	const months: Array<[number, number]> = [];
	let y = start.getFullYear();
	let m = start.getMonth();
	while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
		months.push([y, m]);
		m++;
		if (m > 11) {
			m = 0;
			y++;
		}
	}
	return months;
}

export function daysInRange(start: Date, end: Date): Date[] {
	const result: Date[] = [];
	for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) result.push(d);
	return result;
}

// Poniedziałek jako pierwszy dzień tygodnia
export function startOfWeek(date: Date): Date {
	const dow = (date.getDay() + 6) % 7;
	return addDays(startOfDay(date), -dow);
}

export function isoWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const LOCALE = "en-GB";

export function formatDayTitle(date: Date): { weekday: string; full: string } {
	return {
		weekday: date.toLocaleDateString(LOCALE, { weekday: "long" }),
		full: date.toLocaleDateString(LOCALE, {
			day: "numeric",
			month: "long",
			year: "numeric",
		}),
	};
}

export function formatShortDate(date: Date): string {
	return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
}

export function formatMonth(date: Date): string {
	return date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

export function weekdayName(date: Date, style: "long" | "short" = "long"): string {
	return date.toLocaleDateString(LOCALE, { weekday: style });
}

export function partOfDay(date: Date = new Date()) {
	const hour = date.getHours();
	if (hour < 5) return { greeting: "Good night", emoji: "🌙" };
	if (hour < 12) return { greeting: "Good morning", emoji: "☀️" };
	if (hour < 18) return { greeting: "Good afternoon", emoji: "🌤️" };
	return { greeting: "Good evening", emoji: "🌙" };
}
