import type { Habit } from "@/libs/types";
import { findCatalogHabit } from "@/utils/habitCatalog";
import type { PaletteKey } from "@/utils/pixelIcons";

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

export const STARTER_PACKS: StarterPack[] = [
	{
		key: "morning",
		title: "Fresh mornings",
		blurb: "Start the day awake and kind to yourself",
		icon: "sunny",
		palette: "yellow",
		habits: ["Make the bed", "Drink water", "Get sunlight"],
	},
	{
		key: "move",
		title: "Move more",
		blurb: "A little movement, every single day",
		icon: "directions_walk",
		palette: "orange",
		habits: ["Walking", "Stretching", "Home workout"],
	},
	{
		key: "calm",
		title: "Calm mind",
		blurb: "Small pauses that quiet the noise",
		icon: "self_improvement",
		palette: "purple",
		habits: ["Meditation", "Deep breathing", "Practice gratitude"],
	},
	{
		key: "sleep",
		title: "Better sleep",
		blurb: "Wind down and wake up rested",
		icon: "bedtime",
		palette: "indigo",
		habits: ["No phone before bed", "Evening routine", "Go to bed early"],
	},
	{
		key: "health",
		title: "Healthy basics",
		blurb: "The simple stuff your body loves",
		icon: "ecg_heart",
		palette: "green",
		habits: ["Drink water", "Healthy meal", "Take vitamins"],
	},
	{
		key: "screens",
		title: "Less screen time",
		blurb: "Take your attention back",
		icon: "mobile_off",
		palette: "teal",
		habits: ["Unplug for an hour", "Take a screen break", "Limit screen time"],
	},
	{
		key: "learn",
		title: "Keep learning",
		blurb: "Grow a little bit smarter daily",
		icon: "auto_stories",
		palette: "blue",
		habits: ["Read a book", "Learn a new word", "Listen to a podcast"],
	},
	{
		key: "focus",
		title: "Get things done",
		blurb: "Calm, focused, productive days",
		icon: "task_alt",
		palette: "red",
		habits: ["Plan tomorrow", "Deep work session", "Tidy up workspace"],
	},
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

const BY_PART: Record<DayPart, { title: string; habits: string[] }> = {
	morning: {
		title: "Nice for this morning",
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
		title: "Nice for this afternoon",
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
		title: "Nice for this evening",
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
	const part = BY_PART[dayPartOf(date)];
	return {
		title: part.title,
		habits: part.habits.map((n) => findCatalogHabit(n)).filter((h): h is Habit => Boolean(h)),
	};
}

// --------------------------------------------------------------------------
// Wskazówki „mikro-nawyki” — jedna na otwarcie okna
// --------------------------------------------------------------------------
export const TINY_TIPS = [
	"Start tiny: one page beats “read more”. You can always do extra.",
	"Two or three goals are plenty. Add more once they feel easy.",
	"Pair a new habit with an old one: stretch right after brushing your teeth.",
	"Make it 2 minutes. Showing up matters more than doing a lot.",
	"Missed a day? Your streak gets one free pass a week ❄️",
	"Set a reminder for the goal you forget most often.",
];

export function pickTip(seed = Date.now()): string {
	return TINY_TIPS[Math.abs(Math.floor(seed / 1000)) % TINY_TIPS.length];
}
