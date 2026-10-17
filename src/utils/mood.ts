import type { HabitLog, Mood } from "@/libs/types";
import type { PaletteKey } from "@/utils/pixelIcons";

// ==========================================================================
// Nastrój dnia — skala 1–5 (jedno tapnięcie buźki) i czysta logika
// „które habity idą w parze z lepszym samopoczuciem”.
// ==========================================================================

export interface MoodOption {
	value: Mood;
	label: string;
	icon: string; // pixel icon (assets/pixelIcons.json)
	palette: PaletteKey;
}

export const MOODS: MoodOption[] = [
	{ value: 1, label: "Awful", icon: "sentiment_very_dissatisfied", palette: "red" },
	{ value: 2, label: "Low", icon: "sentiment_dissatisfied", palette: "orange" },
	{ value: 3, label: "Okay", icon: "sentiment_neutral", palette: "yellow" },
	{ value: 4, label: "Good", icon: "sentiment_satisfied", palette: "green" },
	{ value: 5, label: "Great", icon: "sentiment_very_satisfied", palette: "teal" },
];

export function moodOption(mood: number | null | undefined): MoodOption | null {
	return MOODS.find((m) => m.value === mood) ?? null;
}

// Średni nastrój zaokrąglony do najbliższej buźki
export function nearestMood(avg: number | null): MoodOption | null {
	if (avg === null) return null;
	return moodOption(Math.min(5, Math.max(1, Math.round(avg))));
}

export interface MoodDay {
	date: string;
	habits: Pick<HabitLog, "name">[];
	mood?: Mood;
}

export interface MoodLink {
	name: string;
	diff: number; // średni nastrój z habitem − bez niego (skala 1–5)
	withAvg: number;
	withoutAvg: number;
	daysWith: number;
	daysWithout: number;
}

export interface MoodInsights {
	moodDays: number;
	average: number | null;
	boosters: MoodLink[]; // najlepsze na górze
	drains: MoodLink[]; // najgorsze na górze
}

// Mniej danych to raczej przypadek niż wzór
export const MIN_MOOD_DAYS = 5;
const MIN_SIDE_DAYS = 2;
const MIN_DIFF = 0.5;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Dla każdego habitu porównujemy średni nastrój w dni, w które był zrobiony,
// z dniami bez niego. To korelacja, nie dowód — w UI mówimy „idzie w parze”.
export function moodInsights(days: MoodDay[], limit = 3): MoodInsights {
	const rated = days.filter((d) => d.mood);
	if (rated.length === 0) return { moodDays: 0, average: null, boosters: [], drains: [] };
	const average = round1(mean(rated.map((d) => d.mood!)));
	if (rated.length < MIN_MOOD_DAYS) return { moodDays: rated.length, average, boosters: [], drains: [] };

	const names = new Set(rated.flatMap((d) => d.habits.map((h) => h.name)));
	const links: MoodLink[] = [];
	for (const name of names) {
		const withMoods: number[] = [];
		const withoutMoods: number[] = [];
		for (const d of rated) {
			(d.habits.some((h) => h.name === name) ? withMoods : withoutMoods).push(d.mood!);
		}
		if (withMoods.length < MIN_SIDE_DAYS || withoutMoods.length < MIN_SIDE_DAYS) continue;
		const withAvg = mean(withMoods);
		const withoutAvg = mean(withoutMoods);
		links.push({
			name,
			diff: round1(withAvg - withoutAvg),
			withAvg: round1(withAvg),
			withoutAvg: round1(withoutAvg),
			daysWith: withMoods.length,
			daysWithout: withoutMoods.length,
		});
	}
	// Przy remisie wygrywa habit z większą liczbą dni (pewniejszy wynik)
	const byStrength = (a: MoodLink, b: MoodLink) =>
		Math.abs(b.diff) - Math.abs(a.diff) || b.daysWith - a.daysWith || a.name.localeCompare(b.name);
	return {
		moodDays: rated.length,
		average,
		boosters: links.filter((l) => l.diff >= MIN_DIFF).sort(byStrength).slice(0, limit),
		drains: links.filter((l) => l.diff <= -MIN_DIFF).sort(byStrength).slice(0, limit),
	};
}
