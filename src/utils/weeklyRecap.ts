import type { Habit } from "@/libs/types";
import { insightsMessages as m } from "@/i18n/messages/insights";

// ==========================================================================
// Podsumowanie tygodnia — czysta logika (liczby, nagłówek, wskazówka,
// tekst do udostępnienia). Dane dni podaje komponent ze store'u.
// ==========================================================================

export interface RecapDay {
	key: string;
	weekday: string; // np. „Wednesday”
	short: string; // np. „Wed”
	future: boolean;
	checkIns: number; // dobre nawyki
	goalsDone: number;
	goalsTotal: number;
	perfect: boolean;
	habits: Array<{ name: string; habit: Habit; count: number }>;
}

export interface RecapInput {
	days: RecapDay[];
	previous: { checkIns: number; goalsDone: number; goalsTotal: number };
	streak: number;
	label: string; // np. „Oct 6 – 12”
}

export interface Recap {
	checkIns: number;
	perfectDays: number;
	activeDays: number;
	elapsedDays: number;
	goalPct: number | null; // null = brak celów w tym tygodniu
	bestDay: RecapDay | null;
	quietDay: RecapDay | null;
	top: Array<{ name: string; habit: Habit; count: number }>;
	deltaPct: number | null; // zmiana liczby odhaczeń względem poprzedniego tygodnia
	headline: string;
	tip: string;
	empty: boolean;
}

function dayPct(d: RecapDay) {
	return d.goalsTotal ? d.goalsDone / d.goalsTotal : 0;
}

export function buildRecap(input: RecapInput): Recap {
	const days = input.days.filter((d) => !d.future);
	let checkIns = 0;
	let goalsDone = 0;
	let goalsTotal = 0;
	let perfectDays = 0;
	let activeDays = 0;
	const totals = new Map<string, { name: string; habit: Habit; count: number }>();
	for (const d of days) {
		checkIns += d.checkIns;
		goalsDone += d.goalsDone;
		goalsTotal += d.goalsTotal;
		if (d.perfect) perfectDays++;
		if (d.checkIns > 0) activeDays++;
		for (const h of d.habits) {
			const t = totals.get(h.name);
			if (t) t.count += h.count;
			else totals.set(h.name, { ...h });
		}
	}
	const goalPct = goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : null;

	// Najlepszy dzień: najwyższy % celów, potem więcej odhaczeń
	const score = (d: RecapDay) => dayPct(d) * 1000 + d.checkIns;
	const ranked = [...days].sort((a, b) => score(b) - score(a));
	const bestDay = ranked[0] && ranked[0].checkIns > 0 ? ranked[0] : null;
	const withGoals = days.filter((d) => d.goalsTotal > 0);
	const quiet = [...withGoals].sort((a, b) => score(a) - score(b))[0] ?? null;
	const quietDay = quiet && bestDay && score(quiet) < score(bestDay) ? quiet : null;

	const prev = input.previous.checkIns;
	const deltaPct = prev > 0 ? Math.round(((checkIns - prev) / prev) * 100) : null;

	const empty = checkIns === 0 && goalsDone === 0;
	const pct = goalPct ?? (activeDays / Math.max(1, days.length)) * 100;
	let headline: string;
	if (empty) headline = m.headlineEmpty;
	else if (pct >= 90) headline = m.headlineOutstanding;
	else if (pct >= 65) headline = m.headlineStrong;
	else if (pct >= 35) headline = m.headlineSteady;
	else headline = m.headlineEveryStep;

	let tip: string;
	if (empty) tip = m.tipEmpty;
	else if (goalPct === null) tip = m.tipNoGoals;
	else if (perfectDays === days.length && days.length === 7)
		tip = m.tipPerfectWeek;
	else if (quietDay)
		tip = m.tipQuietDay(quietDay.weekday);
	else if (deltaPct !== null && deltaPct > 0) tip = m.tipTrendingUp;
	else tip = m.tipDefault;

	return {
		checkIns,
		perfectDays,
		activeDays,
		elapsedDays: days.length,
		goalPct,
		bestDay,
		quietDay,
		top: [...totals.values()]
			.filter((t) => t.habit.severity !== "danger")
			.sort((a, b) => b.count - a.count)
			.slice(0, 3),
		deltaPct,
		headline,
		tip,
		empty,
	};
}

export function recapShareText(recap: Recap, label: string, streak: number): string {
	const lines = [m.shareTitle(label), recap.headline];
	lines.push(m.shareLogged(recap.checkIns));
	if (recap.goalPct !== null) lines.push(m.shareGoals(recap.goalPct));
	if (recap.perfectDays) lines.push(m.sharePerfect(recap.perfectDays));
	if (streak > 1) lines.push(m.shareStreak(streak));
	if (recap.top[0]) lines.push(m.shareTop(recap.top[0].habit.display_name || recap.top[0].name));
	return lines.join("\n");
}
