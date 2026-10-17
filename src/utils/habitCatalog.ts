import habitListData from "@/assets/habitList.json";
import type { GoalRef, Habit, HabitLog } from "@/libs/types";
import type { PaletteKey } from "@/utils/pixelIcons";
import { defineLocalizedField, locale } from "@/i18n";
import { HABIT_NAMES_PL } from "@/i18n/catalog.pl";

const ALL_HABITS = habitListData as Habit[];

// Angielskie nazwy zapamiętane przed podmianą na gettery — wyszukiwarka
// znajduje habit po angielskiej nazwie także wtedy, gdy UI jest po polsku.
const EN_DISPLAY_NAMES = new Map(ALL_HABITS.map((h) => [h.name, h.display_name]));

// `display_name` habitów z katalogu podąża za językiem (getter), więc reszta
// kodu nic nie musi wiedzieć o tłumaczeniach. `name` (klucz w Firestore) bez zmian.
// Własne habity użytkownika nie są w katalogu — zostają z wpisaną nazwą.
for (const habit of ALL_HABITS) defineLocalizedField(habit, "display_name", HABIT_NAMES_PL[habit.name]);

// Wycofanych habitów nie da się już dodać, ale zostają w BY_NAME,
// żeby stare wpisy (zapisane samą nazwą) dalej miały ikonę i nazwę.
export const CATALOG = ALL_HABITS.filter((h) => !h.retired);

const BY_NAME = new Map(ALL_HABITS.map((h) => [h.name, h]));

// ==========================================================================
// Kategorie — 21 surowych kategorii z katalogu zgrupowane w 12 czytelnych.
// Używane zarówno w wyszukiwarce, jak i w statystykach (jedna taksonomia).
// ==========================================================================
export type SuperCategoryKey =
	| "yours"
	| "fitness"
	| "health"
	| "food"
	| "mind"
	| "work"
	| "learning"
	| "home"
	| "social"
	| "life"
	| "pets"
	| "tech"
	| "finance";

export interface SuperCategory {
	key: SuperCategoryKey;
	label: string;
	short: string; // krótka nazwa na kafelek filtra w oknie dodawania
	emoji: string;
	icon: string; // pikselowa ikona (Material Symbols) — musi być w EXTRA_ICONS generatora
	palette: PaletteKey;
	sources: string[];
}

export const SUPER_CATEGORIES: SuperCategory[] = [
	{
		key: "fitness",
		label: "Fitness",
		short: "Fitness",
		emoji: "🏃",
		icon: "directions_run",
		palette: "orange",
		sources: ["Sports & Games", "Fitness & Movement"],
	},
	{
		key: "health",
		label: "Health & Body",
		short: "Health",
		emoji: "💪",
		icon: "ecg_heart",
		palette: "teal",
		sources: [
			"Personal Hygiene & Grooming",
			"Health Monitoring",
			"Body Care & Recovery",
			"Sleep & Routines",
		],
	},
	{
		key: "food",
		label: "Food",
		short: "Food",
		emoji: "🍎",
		icon: "nutrition",
		palette: "red",
		sources: ["Nutrition & Food"],
	},
	{
		key: "mind",
		label: "Mind",
		short: "Mind",
		emoji: "🧘",
		icon: "self_improvement",
		palette: "purple",
		sources: ["Mental Health & Mindfulness", "Spirituality & Reflection"],
	},
	{
		key: "work",
		label: "Work & Focus",
		short: "Work",
		emoji: "💼",
		icon: "work",
		palette: "blue",
		sources: ["Productivity & Work"],
	},
	{
		key: "learning",
		label: "Learning",
		short: "Learning",
		emoji: "📚",
		icon: "menu_book",
		palette: "indigo",
		sources: ["Learning & Growth"],
	},
	{
		key: "home",
		label: "Home",
		short: "Home",
		emoji: "🏡",
		icon: "home",
		palette: "brown",
		sources: ["Home & Chores"],
	},
	{
		key: "social",
		label: "People",
		short: "People",
		emoji: "👥",
		icon: "group",
		palette: "pink",
		sources: ["Social & Community", "Family & Relationships"],
	},
	{
		key: "life",
		label: "Life & Play",
		short: "Play",
		emoji: "🎨",
		icon: "palette",
		palette: "green",
		sources: [
			"Creativity & Hobbies",
			"Travel & Adventure",
			"Outdoors & Nature",
			"Transport & Car",
		],
	},
	{
		key: "pets",
		label: "Pets",
		short: "Pets",
		emoji: "🐾",
		icon: "pets",
		palette: "sand",
		sources: ["Pets"],
	},
	{
		key: "tech",
		label: "Digital",
		short: "Digital",
		emoji: "📱",
		icon: "devices",
		palette: "gray",
		sources: ["Digital Wellbeing & Tech"],
	},
	{
		key: "finance",
		label: "Money",
		short: "Money",
		emoji: "💰",
		icon: "savings",
		palette: "yellow",
		sources: ["Finance"],
	},
];

export const CUSTOM_CATEGORY: SuperCategory = {
	key: "yours",
	label: "Your habits",
	short: "Yours",
	emoji: "⭐",
	icon: "star",
	palette: "orange",
	sources: [],
};

// Polskie etykiety kategorii (gettery, żeby zmiana języka działała od razu)
const SUPER_CATEGORY_PL: Record<SuperCategoryKey, { label: string; short: string }> = {
	yours: { label: "Twoje habity", short: "Twoje" },
	fitness: { label: "Fitness", short: "Fitness" },
	health: { label: "Zdrowie i ciało", short: "Zdrowie" },
	food: { label: "Jedzenie", short: "Jedzenie" },
	mind: { label: "Umysł", short: "Umysł" },
	work: { label: "Praca i skupienie", short: "Praca" },
	learning: { label: "Nauka", short: "Nauka" },
	home: { label: "Dom", short: "Dom" },
	social: { label: "Ludzie", short: "Ludzie" },
	life: { label: "Życie i zabawa", short: "Zabawa" },
	pets: { label: "Zwierzaki", short: "Zwierzaki" },
	tech: { label: "Cyfrowe życie", short: "Cyfrowe" },
	finance: { label: "Pieniądze", short: "Pieniądze" },
};
for (const def of [...SUPER_CATEGORIES, CUSTOM_CATEGORY]) {
	defineLocalizedField(def, "label", SUPER_CATEGORY_PL[def.key].label);
	defineLocalizedField(def, "short", SUPER_CATEGORY_PL[def.key].short);
}

const SOURCE_TO_SUPER = new Map<string, SuperCategory>();
for (const def of SUPER_CATEGORIES)
	for (const src of def.sources) SOURCE_TO_SUPER.set(src, def);

export function superCategoryOf(habit: Pick<Habit, "category" | "origin">): SuperCategory | null {
	if (habit.origin === "user") return CUSTOM_CATEGORY;
	if (!habit.category) return null;
	return SOURCE_TO_SUPER.get(habit.category) ?? null;
}

// Dobre na start — gdy użytkownik nie ma jeszcze historii
export const STARTER_HABITS = [
	"Drink water",
	"Walking",
	"Read a book",
	"Meditation",
	"Brush teeth",
	"Stretching",
	"Journaling",
	"Go to bed early",
	"Take vitamins",
	"Practice gratitude",
	"Gym",
	"Call family",
];

export function findCatalogHabit(name: string): Habit | undefined {
	return BY_NAME.get(name);
}

// Zamienia zapisany wpis (stary pełny lub nowy „odchudzony”) na pełny Habit.
// Katalog ma pierwszeństwo, więc poprawki ikon/nazw działają też dla historii.
export function resolveHabit(
	entry: HabitLog | GoalRef | Habit,
	customHabits: Habit[] = [],
): Habit {
	const fromCatalog = BY_NAME.get(entry.name);
	if (fromCatalog) return fromCatalog;
	const custom = customHabits.find((h) => h.name === entry.name);
	if (custom) return custom;
	return {
		name: entry.name,
		icon: entry.icon || "star",
		severity: entry.severity || "success",
		tags: entry.tags || [],
		origin: entry.origin || "user",
		display_name: entry.display_name || entry.name,
		category: (entry as HabitLog).category,
	};
}

export function displayName(habit: Pick<Habit, "display_name" | "name">): string {
	return habit.display_name || habit.name;
}

export function isNegative(habit: Pick<Habit, "severity">): boolean {
	return habit.severity === "danger";
}

// Ikony, które powinny mieć „swój” kolor niezależnie od kategorii
const ICON_PALETTE: Record<string, PaletteKey> = {
	water_drop: "blue",
	water: "blue",
	water_full: "blue",
	pool: "blue",
	shower: "blue",
	bathtub: "blue",
	scuba_diving: "blue",
	surfing: "blue",
	kayaking: "blue",
	rowing: "blue",
	sailing: "blue",
	kitesurfing: "blue",
	severe_cold: "blue",
	ac_unit: "blue",
	cloud: "blue",
	bedtime: "purple",
	moon_stars: "purple",
	nightlight: "purple",
	king_bed: "purple",
	bed: "purple",
	bedroom_parent: "purple",
	sunny: "yellow",
	light_mode: "yellow",
	wb_sunny: "yellow",
	wb_twilight: "yellow",
	beach_access: "yellow",
	lightbulb: "yellow",
	wb_incandescent: "yellow",
	emoji_objects: "yellow",
	star: "yellow",
	star_shine: "yellow",
	trophy: "yellow",
	bolt: "yellow",
	eco: "green",
	park: "green",
	forest: "green",
	grass: "green",
	yard: "green",
	local_florist: "green",
	filter_vintage: "green",
	potted_plant: "green",
	energy_savings_leaf: "green",
	compost: "green",
	nutrition: "green",
	recycling: "green",
	emoji_nature: "green",
	favorite: "red",
	volunteer_activism: "red",
	monitor_heart: "red",
	bloodtype: "red",
	local_fire_department: "orange",
	sauna: "orange",
	hot_tub: "orange",
	coffee: "brown",
	emoji_food_beverage: "brown",
	bakery_dining: "brown",
	cookie: "brown",
	coffee_maker: "brown",
	breakfast_dining: "brown",
	savings: "pink",
};

export function paletteFor(habit: Pick<Habit, "icon" | "severity" | "category" | "origin">): PaletteKey {
	if (habit.severity === "danger") return "plum";
	const byIcon = ICON_PALETTE[habit.icon];
	if (byIcon) return byIcon;
	return superCategoryOf(habit)?.palette ?? "orange";
}

// Wyszukiwanie bez polskich/obcych znaków diakrytycznych
// („ł” nie rozkłada się w NFD, więc zamieniamy je ręcznie: „lyzwy” → „Łyżwy”)
export function normalizeText(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ł/g, "l");
}

export function matchesQuery(habit: Habit, normalizedQuery: string): boolean {
	if (!normalizedQuery) return true;
	if (normalizeText(habit.name).includes(normalizedQuery)) return true;
	// display_name jest w aktualnym języku; angielska nazwa katalogowa działa zawsze
	if (habit.display_name) {
		const shown = normalizeText(habit.display_name);
		if (shown.includes(normalizedQuery)) return true;
		// Polska odmiana: „lodowka” ma znaleźć „Mycie lodówki”, więc próbujemy
		// też bez końcowej samogłoski (tylko dla dłuższych zapytań)
		if (locale.value === "pl" && normalizedQuery.length >= 5) {
			const stem = normalizedQuery.replace(/[aeiouy]$/, "");
			if (stem !== normalizedQuery && shown.includes(stem)) return true;
		}
	}
	const enDisplay = habit.origin === "user" ? undefined : EN_DISPLAY_NAMES.get(habit.name);
	if (enDisplay && normalizeText(enDisplay).includes(normalizedQuery)) return true;
	return habit.tags?.some((t) => normalizeText(t).includes(normalizedQuery)) ?? false;
}
