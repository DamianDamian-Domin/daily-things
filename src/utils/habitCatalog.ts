import habbitListData from "@/assets/habbitList.json";
import type { GoalRef, Habbit, HabbitLog } from "@/libs/types";
import type { PaletteKey } from "@/utils/pixelIcons";

export const CATALOG = habbitListData as Habbit[];

const BY_NAME = new Map(CATALOG.map((h) => [h.name, h]));

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
	emoji: string;
	palette: PaletteKey;
	sources: string[];
}

export const SUPER_CATEGORIES: SuperCategory[] = [
	{
		key: "fitness",
		label: "Fitness",
		emoji: "🏃",
		palette: "orange",
		sources: ["Sports & Games", "Fitness & Movement"],
	},
	{
		key: "health",
		label: "Health & Body",
		emoji: "💪",
		palette: "teal",
		sources: [
			"Personal Hygiene & Grooming",
			"Health Monitoring",
			"Body Care & Recovery",
			"Sleep & Routines",
		],
	},
	{ key: "food", label: "Food", emoji: "🍎", palette: "red", sources: ["Nutrition & Food"] },
	{
		key: "mind",
		label: "Mind",
		emoji: "🧘",
		palette: "purple",
		sources: ["Mental Health & Mindfulness", "Spirituality & Reflection"],
	},
	{
		key: "work",
		label: "Work & Focus",
		emoji: "💼",
		palette: "blue",
		sources: ["Productivity & Work"],
	},
	{
		key: "learning",
		label: "Learning",
		emoji: "📚",
		palette: "indigo",
		sources: ["Learning & Growth"],
	},
	{ key: "home", label: "Home", emoji: "🏡", palette: "brown", sources: ["Home & Chores"] },
	{
		key: "social",
		label: "People",
		emoji: "👥",
		palette: "pink",
		sources: ["Social & Community", "Family & Relationships"],
	},
	{
		key: "life",
		label: "Life & Play",
		emoji: "🎨",
		palette: "green",
		sources: [
			"Creativity & Hobbies",
			"Travel & Adventure",
			"Outdoors & Nature",
			"Transport & Car",
		],
	},
	{ key: "pets", label: "Pets", emoji: "🐾", palette: "sand", sources: ["Pets"] },
	{
		key: "tech",
		label: "Digital",
		emoji: "📱",
		palette: "gray",
		sources: ["Digital Wellbeing & Tech"],
	},
	{ key: "finance", label: "Money", emoji: "💰", palette: "yellow", sources: ["Finance"] },
];

export const CUSTOM_CATEGORY: SuperCategory = {
	key: "yours",
	label: "Your habits",
	emoji: "⭐",
	palette: "orange",
	sources: [],
};

const SOURCE_TO_SUPER = new Map<string, SuperCategory>();
for (const def of SUPER_CATEGORIES)
	for (const src of def.sources) SOURCE_TO_SUPER.set(src, def);

export function superCategoryOf(habbit: Pick<Habbit, "category" | "origin">): SuperCategory | null {
	if (habbit.origin === "user") return CUSTOM_CATEGORY;
	if (!habbit.category) return null;
	return SOURCE_TO_SUPER.get(habbit.category) ?? null;
}

// Dobre na start — gdy użytkownik nie ma jeszcze historii
export const STARTER_HABBITS = [
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

export function findCatalogHabbit(name: string): Habbit | undefined {
	return BY_NAME.get(name);
}

// Zamienia zapisany wpis (stary pełny lub nowy „odchudzony”) na pełny Habbit.
// Katalog ma pierwszeństwo, więc poprawki ikon/nazw działają też dla historii.
export function resolveHabbit(
	entry: HabbitLog | GoalRef | Habbit,
	customHabbits: Habbit[] = [],
): Habbit {
	const fromCatalog = BY_NAME.get(entry.name);
	if (fromCatalog) return fromCatalog;
	const custom = customHabbits.find((h) => h.name === entry.name);
	if (custom) return custom;
	return {
		name: entry.name,
		icon: entry.icon || "star",
		severity: entry.severity || "success",
		tags: entry.tags || [],
		origin: entry.origin || "user",
		display_name: entry.display_name || entry.name,
		category: (entry as HabbitLog).category,
	};
}

export function displayName(habbit: Pick<Habbit, "display_name" | "name">): string {
	return habbit.display_name || habbit.name;
}

export function isNegative(habbit: Pick<Habbit, "severity">): boolean {
	return habbit.severity === "danger";
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

export function paletteFor(habbit: Pick<Habbit, "icon" | "severity" | "category" | "origin">): PaletteKey {
	if (habbit.severity === "danger") return "plum";
	const byIcon = ICON_PALETTE[habbit.icon];
	if (byIcon) return byIcon;
	return superCategoryOf(habbit)?.palette ?? "orange";
}

// Wyszukiwanie bez polskich/obcych znaków diakrytycznych
export function normalizeText(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "");
}

export function matchesQuery(habbit: Habbit, normalizedQuery: string): boolean {
	if (!normalizedQuery) return true;
	if (normalizeText(habbit.name).includes(normalizedQuery)) return true;
	if (habbit.display_name && normalizeText(habbit.display_name).includes(normalizedQuery))
		return true;
	return habbit.tags?.some((t) => normalizeText(t).includes(normalizedQuery)) ?? false;
}
