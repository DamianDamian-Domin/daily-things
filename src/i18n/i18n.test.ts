import { afterEach, describe, expect, it } from "vitest";
import {
	defineLocalizedField,
	defineMessages,
	detectLocale,
	enPlural,
	locale,
	plPlural,
	registeredDictionaries,
	setLocale,
} from "@/i18n";
import "@/i18n/messages/common";
import "@/i18n/messages/settings";
import "@/i18n/messages/export";

afterEach(() => setLocale("en", { remember: false }));

describe("detectLocale", () => {
	it("picks Polish for pl* browsers and English otherwise", () => {
		expect(detectLocale(["pl-PL", "en-US"])).toBe("pl");
		expect(detectLocale(["pl"])).toBe("pl");
		expect(detectLocale(["en-GB", "pl"])).toBe("en");
		expect(detectLocale(["de-DE", "pl-PL"])).toBe("pl");
		expect(detectLocale(["fr-FR"])).toBe("en");
		expect(detectLocale([])).toBe("en");
	});
});

describe("plPlural", () => {
	it.each([
		[1, "dzień"],
		[2, "dni"],
		[4, "dni"],
		[5, "dni"],
		[12, "dni"],
		[22, "dni"],
	])("%i dni", (n, word) => {
		expect(plPlural(n, "dzień", "dni", "dni")).toBe(word);
	});

	it.each([
		[1, "habit"],
		[2, "habity"],
		[5, "habitów"],
		[11, "habitów"],
		[13, "habitów"],
		[21, "habitów"],
		[23, "habity"],
		[112, "habitów"],
		[0, "habitów"],
	])("%i habit", (n, word) => {
		expect(plPlural(n, "habit", "habity", "habitów")).toBe(word);
	});

	it("handles English", () => {
		expect(enPlural(1, "day", "days")).toBe("day");
		expect(enPlural(0, "day", "days")).toBe("days");
	});
});

describe("defineMessages", () => {
	it("follows the current locale", () => {
		const m = defineMessages(
			{ hi: "Hi", count: (n: number) => `${n} ${enPlural(n, "day", "days")}` },
			{ hi: "Cześć", count: (n) => `${n} ${plPlural(n, "dzień", "dni", "dni")}` },
		);
		expect(m.hi).toBe("Hi");
		expect(m.count(2)).toBe("2 days");
		setLocale("pl", { remember: false });
		expect(locale.value).toBe("pl");
		expect(m.hi).toBe("Cześć");
		expect(m.count(1)).toBe("1 dzień");
	});
});

describe("defineLocalizedField", () => {
	it("turns a constant field into a locale-aware getter", () => {
		const habit = { name: "Gym", display_name: "Gym" };
		defineLocalizedField(habit, "display_name", "Siłownia");
		expect(habit.display_name).toBe("Gym");
		setLocale("pl", { remember: false });
		expect(habit.display_name).toBe("Siłownia");
		expect(JSON.parse(JSON.stringify(habit)).display_name).toBe("Siłownia");
	});
});

// Typecheck pilnuje kluczy, a ten test łapie puste tłumaczenia i
// różnice w strukturze (np. tablice) we wszystkich zaimportowanych słownikach.
function shape(value: unknown): unknown {
	if (typeof value === "function") return "fn";
	if (typeof value === "string") return value.trim() ? "str" : "EMPTY";
	if (Array.isArray(value)) return value.length ? "arr" : "EMPTY_ARR";
	if (value && typeof value === "object")
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
	return typeof value;
}

describe("dictionaries", () => {
	it("Polish matches English structure and has no empty strings", async () => {
		const modules = import.meta.glob("./messages/*.ts", { eager: true });
		expect(Object.keys(modules).length).toBeGreaterThan(0);
		for (const { en, pl } of registeredDictionaries()) {
			expect(shape(pl)).toEqual(shape(en));
		}
	});
});
