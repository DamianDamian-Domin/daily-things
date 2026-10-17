import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { HABIT_NAMES_PL } from "@/i18n/catalog.pl";
import habitListData from "@/assets/habitList.json";
import type { Habit } from "@/libs/types";
import { STARTER_PACKS, timelySuggestions } from "@/utils/starterPacks";
import pixelIcons from "@/assets/pixelIcons.json";
import {
	CATALOG,
	CUSTOM_CATEGORY,
	STARTER_HABITS,
	SUPER_CATEGORIES,
	displayName,
	findCatalogHabit,
	isNegative,
	matchesQuery,
	normalizeText,
	paletteFor,
	resolveHabit,
	superCategoryOf,
} from "@/utils/habitCatalog";

describe("catalog data", () => {
	it("has unique habit names", () => {
		const names = CATALOG.map((h) => h.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("maps every catalog category to a super category", () => {
		const unmapped = CATALOG.filter((h) => h.category && !superCategoryOf(h)).map(
			(h) => `${h.name} (${h.category})`,
		);
		expect(unmapped).toEqual([]);
	});

	it("assigns each raw category to only one super category", () => {
		const sources = SUPER_CATEGORIES.flatMap((c) => c.sources);
		expect(new Set(sources).size).toBe(sources.length);
	});

	it("only suggests starter habits that exist in the catalog", () => {
		expect(STARTER_HABITS.filter((name) => !findCatalogHabit(name))).toEqual([]);
	});

	it("never suggests retired habits", () => {
		const suggested = [
			...STARTER_HABITS,
			...STARTER_PACKS.flatMap((p) => p.habits),
			...[6, 14, 21].flatMap((hour) =>
				timelySuggestions(new Date(2026, 0, 1, hour)).habits.map((h) => h.name),
			),
		];
		expect(suggested.filter((name) => !CATALOG.some((h) => h.name === name))).toEqual([]);
	});

	it("has a pixel icon for every catalog habit", () => {
		const icons = (pixelIcons as { icons: Record<string, string> }).icons;
		expect(CATALOG.filter((h) => !icons[h.icon]).map((h) => h.name)).toEqual([]);
	});
});

describe("retired habits", () => {
	it("are hidden from the catalog but still resolve for old history", () => {
		expect(CATALOG.some((h) => h.retired)).toBe(false);
		const old = findCatalogHabit("Check the weather");
		expect(old?.retired).toBe(true);
		expect(resolveHabit({ name: "Check the weather" } as Habit)).toBe(old);
	});
});

describe("superCategoryOf", () => {
	it("puts user habits in the custom category", () => {
		expect(superCategoryOf({ origin: "user", category: "Pets" })).toBe(CUSTOM_CATEGORY);
	});

	it("maps a raw category to its group", () => {
		expect(superCategoryOf({ origin: "system", category: "Sleep & Routines" })?.key).toBe("health");
	});

	it("returns null for missing or unknown categories", () => {
		expect(superCategoryOf({ origin: "system", category: undefined })).toBeNull();
		expect(superCategoryOf({ origin: "system", category: "Nope" })).toBeNull();
	});
});

describe("resolveHabit", () => {
	it("prefers the catalog entry over stored data", () => {
		const gym = findCatalogHabit("Gym")!;
		expect(resolveHabit({ ...gym, icon: "old_icon" } as Habit)).toBe(gym);
	});

	it("falls back to the user's custom habits", () => {
		const custom = { name: "Feed cat Mruczek", icon: "pets", severity: "success", origin: "user" } as Habit;
		expect(resolveHabit({ name: "Feed cat Mruczek" } as Habit, [custom])).toBe(custom);
	});

	it("fills defaults for an unknown entry", () => {
		expect(resolveHabit({ name: "Mystery" } as Habit)).toMatchObject({
			name: "Mystery",
			icon: "star",
			severity: "success",
			tags: [],
			origin: "user",
			display_name: "Mystery",
		});
	});
});

describe("small helpers", () => {
	it("displayName falls back to name", () => {
		expect(displayName({ name: "a", display_name: "A" })).toBe("A");
		expect(displayName({ name: "a", display_name: "" })).toBe("a");
	});

	it("isNegative is true only for danger", () => {
		expect(isNegative({ severity: "danger" })).toBe(true);
		expect(isNegative({ severity: "success" })).toBe(false);
	});

	it("paletteFor: negative, then icon, then category", () => {
		expect(paletteFor({ severity: "danger", icon: "water_drop", origin: "system" })).toBe("plum");
		expect(paletteFor({ severity: "success", icon: "water_drop", origin: "system" })).toBe("blue");
		expect(
			paletteFor({ severity: "success", icon: "x", origin: "system", category: "Pets" }),
		).toBe("sand");
		expect(paletteFor({ severity: "success", icon: "x", origin: "system" })).toBe("orange");
	});
});

describe("search", () => {
	it("normalizes case and diacritics", () => {
		expect(normalizeText("Żółć Ąę")).toBe("zolc ae");
		expect(normalizeText("Łyżwy")).toBe("lyzwy");
		expect(normalizeText("Café")).toBe("cafe");
	});

	const habit = {
		name: "Read a book",
		display_name: "Czytanie książki",
		tags: ["learning"],
	} as Habit;

	it("matches name, display name and tags", () => {
		expect(matchesQuery(habit, "")).toBe(true);
		expect(matchesQuery(habit, "book")).toBe(true);
		expect(matchesQuery(habit, normalizeText("książ"))).toBe(true);
		expect(matchesQuery(habit, "learn")).toBe(true);
		expect(matchesQuery(habit, "gym")).toBe(false);
	});
});

describe("polskie nazwy z katalogu", () => {
	afterEach(() => setLocale("en", { remember: false }));

	it("każdy habit z katalogu (także wycofany) ma polską nazwę", () => {
		const all = habitListData as Habit[];
		expect(all.filter((h) => !HABIT_NAMES_PL[h.name]?.trim()).map((h) => h.name)).toEqual([]);
		const names = new Set(all.map((h) => h.name));
		expect(Object.keys(HABIT_NAMES_PL).filter((k) => !names.has(k))).toEqual([]);
	});

	it("display_name przełącza się z językiem, a name zostaje", () => {
		const walking = findCatalogHabit("Walking")!;
		expect(walking.display_name).toBe("Walk outside");
		setLocale("pl", { remember: false });
		expect(walking.display_name).toBe("Spacer na dworze");
		expect(displayName(walking)).toBe("Spacer na dworze");
		expect(walking.name).toBe("Walking");
		expect(findCatalogHabit("Check the weather")?.display_name).toBe("Sprawdź pogodę");
		setLocale("en", { remember: false });
		expect(walking.display_name).toBe("Walk outside");
	});

	it("kopia habitu z katalogu ma nazwę w aktualnym języku", () => {
		setLocale("pl", { remember: false });
		expect({ ...findCatalogHabit("Gym")! }.display_name).toBe("Siłownia");
	});

	it("tłumaczy etykiety kategorii", () => {
		const health = SUPER_CATEGORIES.find((c) => c.key === "health")!;
		expect(health.label).toBe("Health & Body");
		setLocale("pl", { remember: false });
		expect(health.label).toBe("Zdrowie i ciało");
		expect(health.short).toBe("Zdrowie");
		expect(CUSTOM_CATEGORY.label).toBe("Twoje habity");
	});

	it("nie tłumaczy własnych habitów użytkownika", () => {
		setLocale("pl", { remember: false });
		const custom = { name: "Gym", display_name: "Gym", origin: "user", icon: "x", severity: "success" } as Habit;
		expect(displayName(custom)).toBe("Gym");
		expect(resolveHabit({ name: "Feed cat Mruczek" } as Habit).display_name).toBe("Feed cat Mruczek");
	});

	const search = (q: string) => CATALOG.filter((h) => matchesQuery(h, normalizeText(q))).map((h) => h.name);

	it("po polsku znajduje habit po polskiej nazwie, także bez ogonków", () => {
		setLocale("pl", { remember: false });
		expect(search("lodowka")).toContain("Clean the fridge");
		expect(search("Lodówka")).toContain("Clean the fridge");
		expect(search("lyzwy")).toContain("Ice skating");
		expect(search("silownia")).toContain("Gym");
	});

	it("angielska nazwa i tagi działają w obu językach", () => {
		for (const l of ["en", "pl"] as const) {
			setLocale(l, { remember: false });
			expect(search("walk outside")).toContain("Walking");
			expect(search("fridge")).toContain("Clean the fridge");
			expect(search("cardio")).toContain("Running");
		}
	});

	it("po angielsku nie dopasowuje polskich nazw", () => {
		expect(search("silownia")).toEqual([]);
	});
});
