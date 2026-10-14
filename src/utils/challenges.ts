import { addDays, fromDateKey, toDateKey, type DateKey } from "@/utils/date";
import type { PaletteKey } from "@/utils/pixelIcons";

// ==========================================================================
// Wyzwania ze znajomymi: „7 dni bez słodyczy razem”. Każdy uczestnik
// odhacza kolejne dni, a wspólny pasek pokazuje postęp całej drużyny.
// Tu jest tylko czysta logika (bez Firestore), żeby dało się ją testować.
// ==========================================================================

export const CHALLENGE_LENGTHS = [7, 14, 21, 30] as const;
export const MIN_CHALLENGE_DAYS = 3;
export const MAX_CHALLENGE_DAYS = 30;
// Razem ze mną (reguły Firestore sprawdzają każdego zaproszonego osobno)
export const MAX_CHALLENGE_PEOPLE = 5;
export const MAX_ACTIVE_CHALLENGES = 10;
export const MAX_TITLE_LENGTH = 40;
// Zakończone wyzwanie widać jeszcze przez tyle dni (potem chowamy)
export const FINISHED_VISIBLE_DAYS = 7;

export interface ChallengeTemplate {
	key: string;
	title: string;
	icon: string;
	palette: PaletteKey;
	days: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
	{ key: "sweets", title: "No sweets", icon: "cookie", palette: "pink", days: 7 },
	{ key: "walk", title: "Daily walk", icon: "directions_walk", palette: "orange", days: 7 },
	{ key: "read", title: "Read every day", icon: "auto_stories", palette: "blue", days: 14 },
	{ key: "water", title: "Drink enough water", icon: "water_drop", palette: "teal", days: 7 },
	{ key: "phone", title: "No phone before bed", icon: "mobile_off", palette: "indigo", days: 7 },
	{ key: "calm", title: "Meditate", icon: "self_improvement", palette: "purple", days: 14 },
	{ key: "workout", title: "Work out", icon: "fitness_center", palette: "red", days: 21 },
];

export const CUSTOM_CHALLENGE_ICON = "flag";
export const CUSTOM_CHALLENGE_PALETTE: PaletteKey = "green";

export interface ChallengePerson {
	name: string;
	// Znormalizowany awatar trzymamy jako „unknown” — tu go nie potrzebujemy
	avatar: unknown;
}

export interface Challenge {
	id: string;
	title: string;
	icon: string;
	palette: PaletteKey;
	days: number;
	start: DateKey;
	createdBy: string;
	// Wszyscy zaproszeni (także ci, którzy jeszcze nie dołączyli)
	members: string[];
	// Ci, którzy dołączyli
	joined: string[];
	people: Record<string, ChallengePerson>;
	// uid → odhaczone dni (YYYY-MM-DD)
	checkins: Record<string, DateKey[]>;
}

// --------------------------------------------------------------------------
// MAPOWANIE (dane z Firestore traktujemy jako niezaufane)
// --------------------------------------------------------------------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PALETTE_KEYS: PaletteKey[] = [
	"orange", "teal", "red", "purple", "blue", "indigo",
	"brown", "pink", "green", "sand", "gray", "yellow",
];

function strings(raw: unknown, max: number): string[] {
	return Array.isArray(raw)
		? [...new Set(raw.filter((x): x is string => typeof x === "string"))].slice(0, max)
		: [];
}

export function toChallenge(id: string, raw: Record<string, unknown> | undefined): Challenge | null {
	if (!raw) return null;
	const start = typeof raw.start === "string" && DATE_RE.test(raw.start) ? raw.start : null;
	const days = typeof raw.days === "number" ? Math.round(raw.days) : NaN;
	if (!start || !(days >= MIN_CHALLENGE_DAYS && days <= MAX_CHALLENGE_DAYS)) return null;
	const members = strings(raw.members, MAX_CHALLENGE_PEOPLE);
	if (members.length === 0) return null;
	const joined = strings(raw.joined, MAX_CHALLENGE_PEOPLE).filter((u) => members.includes(u));

	const people: Record<string, ChallengePerson> = {};
	const rawPeople = (raw.people ?? {}) as Record<string, unknown>;
	for (const uid of members) {
		const p = (rawPeople[uid] ?? {}) as Record<string, unknown>;
		people[uid] = {
			name: typeof p.name === "string" && p.name ? p.name.slice(0, 40) : "Friend",
			avatar: p.avatar,
		};
	}

	const checkins: Record<string, DateKey[]> = {};
	const rawCheckins = (raw.checkins ?? {}) as Record<string, unknown>;
	const end = endKey({ start, days });
	for (const uid of joined) {
		checkins[uid] = strings(rawCheckins[uid], MAX_CHALLENGE_DAYS * 2)
			.filter((d) => DATE_RE.test(d) && d >= start && d <= end)
			.sort();
	}

	const title = typeof raw.title === "string" ? raw.title.trim().slice(0, MAX_TITLE_LENGTH) : "";
	return {
		id,
		title: title || "Challenge",
		icon: typeof raw.icon === "string" && raw.icon ? raw.icon : CUSTOM_CHALLENGE_ICON,
		palette: PALETTE_KEYS.includes(raw.palette as PaletteKey)
			? (raw.palette as PaletteKey)
			: CUSTOM_CHALLENGE_PALETTE,
		days,
		start,
		createdBy: typeof raw.createdBy === "string" ? raw.createdBy : "",
		members,
		joined,
		people,
		checkins,
	};
}

// --------------------------------------------------------------------------
// KALENDARZ WYZWANIA
// --------------------------------------------------------------------------
export function endKey(c: Pick<Challenge, "start" | "days">): DateKey {
	return toDateKey(addDays(fromDateKey(c.start), c.days - 1));
}

export function challengeDays(c: Pick<Challenge, "start" | "days">): DateKey[] {
	const first = fromDateKey(c.start);
	return Array.from({ length: c.days }, (_, i) => toDateKey(addDays(first, i)));
}

export type ChallengePhase = "upcoming" | "active" | "finished";

export function phaseOf(c: Pick<Challenge, "start" | "days">, today: DateKey): ChallengePhase {
	if (today < c.start) return "upcoming";
	return today > endKey(c) ? "finished" : "active";
}

// Który to dzień wyzwania (1…days); 0 przed startem
export function dayNumber(c: Pick<Challenge, "start" | "days">, today: DateKey): number {
	if (today < c.start) return 0;
	const diff = Math.round(
		(fromDateKey(today).getTime() - fromDateKey(c.start).getTime()) / 86_400_000,
	);
	return Math.min(c.days, diff + 1);
}

// Dni, które wolno jeszcze odhaczyć: dziś i wczoraj (ktoś zapomniał wieczorem)
export function checkableDays(c: Pick<Challenge, "start" | "days">, today: DateKey): DateKey[] {
	const yesterday = toDateKey(addDays(fromDateKey(today), -1));
	const end = endKey(c);
	return [yesterday, today].filter((d) => d >= c.start && d <= end);
}

// Zakończone dawno temu nie zajmują miejsca na karcie
export function isStale(c: Pick<Challenge, "start" | "days">, today: DateKey): boolean {
	const hideFrom = toDateKey(addDays(fromDateKey(endKey(c)), FINISHED_VISIBLE_DAYS + 1));
	return today >= hideFrom;
}

// --------------------------------------------------------------------------
// POSTĘP
// --------------------------------------------------------------------------
export interface ChallengeProgress {
	// Odhaczone dni wszystkich uczestników
	done: number;
	// Dni do zrobienia razem (uczestnicy × długość)
	total: number;
	pct: number;
	// Ile dni każdy „powinien” mieć do dziś (wliczając dzisiejszy)
	expected: number;
}

export function teamProgress(c: Challenge, today: DateKey): ChallengeProgress {
	const people = c.joined.length;
	const total = people * c.days;
	const done = c.joined.reduce((sum, uid) => sum + Math.min(c.days, c.checkins[uid]?.length ?? 0), 0);
	return {
		done,
		total,
		pct: total ? Math.round((done / total) * 100) : 0,
		expected: dayNumber(c, today),
	};
}

export function hasCheckedIn(c: Challenge, uid: string, day: DateKey): boolean {
	return c.checkins[uid]?.includes(day) ?? false;
}

// Krótki, ciepły opis stanu drużyny
export function teamMessage(c: Challenge, today: DateKey): string {
	const phase = phaseOf(c, today);
	const { done, total, pct } = teamProgress(c, today);
	if (phase === "upcoming") return "Starts soon 🌱";
	if (phase === "finished") {
		if (total > 0 && done >= total) return "Every single day, together 🏆";
		return pct >= 70 ? `Finished at ${pct}% 🎉 Great teamwork` : `Finished at ${pct}% 🌱`;
	}
	if (c.joined.length < 2) return "Waiting for friends to join 💌";
	const todayDone = c.joined.filter((uid) => hasCheckedIn(c, uid, today)).length;
	if (todayDone === c.joined.length) return "Everyone's done today ✨";
	if (todayDone === 0) return "Nobody's checked in today yet";
	return `${todayDone} of ${c.joined.length} done today`;
}

export function daysLabel(c: Pick<Challenge, "start" | "days">, today: DateKey): string {
	const phase = phaseOf(c, today);
	if (phase === "upcoming") return `${c.days} days`;
	if (phase === "finished") return `${c.days} days · finished`;
	const left = c.days - dayNumber(c, today);
	return `Day ${dayNumber(c, today)} of ${c.days}${left === 0 ? " · last day" : ""}`;
}
