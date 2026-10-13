import { describe, expect, it } from "vitest";
import type { Habbit } from "@/libs/types";
import {
	CATALOG,
	CUSTOM_CATEGORY,
	STARTER_HABBITS,
	SUPER_CATEGORIES,
	displayName,
	findCatalogHabbit,
	isNegative,
	matchesQuery,
	normalizeText,
	paletteFor,
	resolveHabbit,
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
		expect(STARTER_HABBITS.filter((name) => !findCatalogHabbit(name))).toEqual([]);
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

describe("resolveHabbit", () => {
	it("prefers the catalog entry over stored data", () => {
		const gym = findCatalogHabbit("Gym")!;
		expect(resolveHabbit({ ...gym, icon: "old_icon" } as Habbit)).toBe(gym);
	});

	it("falls back to the user's custom habits", () => {
		const custom = { name: "Feed cat Mruczek", icon: "pets", severity: "success", origin: "user" } as Habbit;
		expect(resolveHabbit({ name: "Feed cat Mruczek" } as Habbit, [custom])).toBe(custom);
	});

	it("fills defaults for an unknown entry", () => {
		expect(resolveHabbit({ name: "Mystery" } as Habbit)).toMatchObject({
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
		expect(normalizeText("Żółć Ąę")).toBe("zołc ae");
		expect(normalizeText("Café")).toBe("cafe");
	});

	const habit = {
		name: "Read a book",
		display_name: "Czytanie książki",
		tags: ["learning"],
	} as Habbit;

	it("matches name, display name and tags", () => {
		expect(matchesQuery(habit, "")).toBe(true);
		expect(matchesQuery(habit, "book")).toBe(true);
		expect(matchesQuery(habit, normalizeText("książ"))).toBe(true);
		expect(matchesQuery(habit, "learn")).toBe(true);
		expect(matchesQuery(habit, "gym")).toBe(false);
	});
});
