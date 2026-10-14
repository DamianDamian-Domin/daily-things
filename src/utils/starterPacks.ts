import type { Habit } from "@/libs/types";
import { findCatalogHabit } from "@/utils/habitCatalog";
import type { PaletteKey } from "@/utils/pixelIcons";
import { habitsMessages as m } from "@/i18n/messages/habits";

// ==========================================================================
// Podpowiedzi dla osób, które dopiero zaczynają: gotowe pakiety celów,
// propozycje zależne od pory dnia i krótkie wskazówki „zacznij od małego”.
// Nazwy to klucze z katalogu (src/assets/habitList.json).
// ==========================================================================

export interface StarterPack {
	key: string;
	title: string;
	blurb: string;
	icon: string;
	palette: PaletteKey;
	habits: string[];
}

type PackKey = keyof typeof m.packs;

// Tytuł i opis czytamy przy każdym odczycie — zmieniają się razem z językiem
function pack(key: PackKey, icon: string, palette: PaletteKey, habits: string[]): StarterPack {
	return {
		key,
		icon,
		palette,
		habits,
		get title() {
			return m.packs[key].title;
		},
		get blurb() {
			return m.packs[key].blurb;
		},
	};
}

export const STARTER_PACKS: StarterPack[] = [
	pack("morning", "sunny", "yellow", ["Make the bed", "Drink water", "Get sunlight"]),
	pack("move", "directions_walk", "orange", ["Walking", "Stretching", "Home workout"]),
	pack("calm", "self_improvement", "purple", ["Meditation", "Deep breathing", "Practice gratitude"]),
	pack("sleep", "bedtime", "indigo", ["No phone before bed", "Evening routine", "Go to bed early"]),
	pack("health", "ecg_heart", "green", ["Drink water", "Healthy meal", "Take vitamins"]),
	pack("screens", "mobile_off", "teal", ["Unplug for an hour", "Take a screen break", "Limit screen time"]),
	pack("learn", "auto_stories", "blue", ["Read a book", "Learn a new word", "Listen to a podcast"]),
	pack("focus", "task_alt", "red", ["Plan tomorrow", "Deep work session", "Tidy up workspace"]),
];

export function packHabits(pack: StarterPack): Habit[] {
	return pack.habits.map((n) => findCatalogHabit(n)).filter((h): h is Habit => Boolean(h));
}

// --------------------------------------------------------------------------
// Pora dnia → co zwykle pasuje właśnie teraz
// --------------------------------------------------------------------------
export type DayPart = "morning" | "afternoon" | "evening";

export function dayPartOf(date: Date = new Date()): DayPart {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 18) return "afternoon";
	return "evening";
}

const BY_PART: Record<DayPart, { habits: string[] }> = {
	morning: {
		habits: [
			"Drink water",
			"Make the bed",
			"Get sunlight",
			"Stretching",
			"Meditation",
			"Take vitamins",
			"Brush teeth",
			"Set an intention for the day",
			"Walking",
			"Healthy meal",
			"Read a book",
			"Wake up early",
		],
	},
	afternoon: {
		habits: [
			"Drink water",
			"Walking",
			"Healthy meal",
			"Take a screen break",
			"Deep work session",
			"Stretching",
			"Gym",
			"Call family",
			"Tidy up",
			"Listen to a podcast",
			"Deep breathing",
			"Read a book",
		],
	},
	evening: {
		habits: [
			"Read a book",
			"Journaling",
			"Practice gratitude",
			"Plan tomorrow",
			"No phone before bed",
			"Go to bed early",
			"Floss teeth",
			"Reflect on today's wins",
			"Evening routine",
			"Call family",
			"Stretching",
			"Tidy up",
		],
	},
};

export function timelySuggestions(date: Date = new Date()): { title: string; habits: Habit[] } {
	const dayPart = dayPartOf(date);
	const part = BY_PART[dayPart];
	return {
		title: m.timely[dayPart],
		habits: part.habits.map((n) => findCatalogHabit(n)).filter((h): h is Habit => Boolean(h)),
	};
}

// --------------------------------------------------------------------------
// Wskazówki „mikro-nawyki” — jedna na otwarcie okna
// --------------------------------------------------------------------------
// Teksty w src/i18n/messages/habits.ts (tips)
export function pickTip(seed = Date.now()): string {
	const tips = m.tips;
	return tips[Math.abs(Math.floor(seed / 1000)) % tips.length];
}
