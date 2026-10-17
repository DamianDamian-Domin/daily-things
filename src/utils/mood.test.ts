import { describe, expect, it } from "vitest";
import type { Mood } from "@/libs/types";
import { moodInsights, moodOption, nearestMood } from "@/utils/mood";

const day = (date: string, mood: Mood | undefined, ...names: string[]) => ({
	date,
	mood,
	habits: names.map((name) => ({ name })),
});

describe("moodInsights", () => {
	it("returns nothing without rated days", () => {
		expect(moodInsights([day("2026-10-01", undefined, "Walk")])).toEqual({
			moodDays: 0,
			average: null,
			boosters: [],
			drains: [],
		});
	});

	it("gives only the average while there are too few rated days", () => {
		const res = moodInsights([
			day("2026-10-01", 4, "Walk"),
			day("2026-10-02", 2),
			day("2026-10-03", 5, "Walk"),
		]);
		expect(res.moodDays).toBe(3);
		expect(res.average).toBe(3.7);
		expect(res.boosters).toEqual([]);
	});

	it("finds habits that go with better and worse days", () => {
		const res = moodInsights([
			day("2026-10-01", 5, "Walk", "Read"),
			day("2026-10-02", 4, "Walk"),
			day("2026-10-03", 2, "Doomscrolling"),
			day("2026-10-04", 2, "Doomscrolling", "Read"),
			day("2026-10-05", 4, "Walk"),
			day("2026-10-06", 3, "Read"),
			day("2026-10-07", undefined, "Walk"), // bez oceny — pomijany
		]);
		expect(res.moodDays).toBe(6);
		expect(res.boosters.map((b) => b.name)).toEqual(["Walk"]);
		expect(res.boosters[0]).toMatchObject({ withAvg: 4.3, withoutAvg: 2.3, diff: 2, daysWith: 3, daysWithout: 3 });
		expect(res.drains.map((d) => d.name)).toEqual(["Doomscrolling"]);
		// „Read” — różnica poniżej progu, więc ani w górę, ani w dół
		expect([...res.boosters, ...res.drains].some((l) => l.name === "Read")).toBe(false);
	});

	it("needs the habit on at least two days and missing on at least two", () => {
		const res = moodInsights([
			day("2026-10-01", 5, "Sauna"),
			day("2026-10-02", 2, "Walk"),
			day("2026-10-03", 2, "Walk"),
			day("2026-10-04", 2, "Walk"),
			day("2026-10-05", 2, "Walk"),
		]);
		expect(res.boosters).toEqual([]);
		expect(res.drains).toEqual([]);
	});
});

describe("mood options", () => {
	it("maps values and rounds averages to the closest face", () => {
		expect(moodOption(4)?.label).toBe("Good");
		expect(moodOption(undefined)).toBeNull();
		expect(nearestMood(3.6)?.value).toBe(4);
		expect(nearestMood(null)).toBeNull();
	});
});
