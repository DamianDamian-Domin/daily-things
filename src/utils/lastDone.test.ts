import { describe, expect, it } from "vitest";
import {
	agoLabel,
	agoShort,
	averageGap,
	buildHabitHistory,
	daysBetween,
	findNote,
	freshness,
	rhythmLabel,
} from "@/utils/lastDone";

const day = (date: string, ...names: string[]) => ({
	date,
	habits: names.map((name, i) => ({ id: `${date}-${i}`, name })),
});

describe("buildHabitHistory", () => {
	it("collects distinct days newest first and counts every log", () => {
		const history = buildHabitHistory([
			day("2026-09-01", "Clean the fridge"),
			day("2026-10-12", "Drink water", "Drink water", "Clean the fridge"),
			day("2026-10-01", "Drink water"),
		]);
		expect(history.get("Clean the fridge")).toEqual({
			name: "Clean the fridge",
			dates: ["2026-10-12", "2026-09-01"],
			count: 2,
			notes: {},
		});
		expect(history.get("Drink water")?.dates).toEqual(["2026-10-12", "2026-10-01"]);
		expect(history.get("Drink water")?.count).toBe(3);
	});

	it("keeps notes per day and finds them newest first", () => {
		const history = buildHabitHistory([
			{
				date: "2026-09-01",
				habits: [{ id: "a", name: "Clean the fridge", note: "Changed the filter, model X" }],
			},
			{
				date: "2026-10-12",
				habits: [
					{ id: "b", name: "Clean the fridge", note: "  quick wipe " },
					{ id: "c", name: "Clean the fridge", note: "" },
					{ id: "d", name: "Clean the fridge", note: "new filter too" },
				],
			},
		]);
		const fridge = history.get("Clean the fridge")!;
		expect(fridge.notes).toEqual({
			"2026-09-01": ["Changed the filter, model X"],
			"2026-10-12": ["quick wipe", "new filter too"],
		});
		const lower = (t: string) => t.toLowerCase();
		expect(findNote(fridge, "filter", lower)).toBe("new filter too");
		expect(findNote(fridge, "model x", lower)).toBe("Changed the filter, model X");
		expect(findNote(fridge, "mop", lower)).toBeNull();
		expect(findNote(fridge, "", lower)).toBeNull();
	});

	it("is empty without logs", () => {
		expect(buildHabitHistory([day("2026-10-12")]).size).toBe(0);
	});
});

describe("daysBetween", () => {
	it("counts calendar days across a DST change", () => {
		expect(daysBetween("2026-10-20", "2026-10-27")).toBe(7);
		expect(daysBetween("2026-10-14", "2026-10-14")).toBe(0);
	});
});

describe("agoLabel / agoShort", () => {
	it.each([
		[0, "today", "today"],
		[1, "yesterday", "1d"],
		[12, "12 days ago", "12d"],
		[21, "3 weeks ago", "3w"],
		[100, "3 months ago", "3mo"],
		[400, "over a year ago", "1y"],
		[800, "over 2 years ago", "2y"],
	])("%i days", (days, long, short) => {
		expect(agoLabel(days)).toBe(long);
		expect(agoShort(days)).toBe(short);
	});
});

describe("averageGap / rhythm / freshness", () => {
	it("needs at least two days", () => {
		expect(averageGap(["2026-10-01"])).toBeNull();
		expect(rhythmLabel(null)).toBeNull();
		expect(freshness(100, null)).toBe("fresh");
	});

	it("averages the gaps between days", () => {
		expect(averageGap(["2026-10-31", "2026-10-01", "2026-09-01"])).toBe(30);
		expect(rhythmLabel(30)).toBe("about every 4 weeks");
		expect(rhythmLabel(1)).toBe("almost every day");
		expect(rhythmLabel(7)).toBe("about every 7 days");
		expect(rhythmLabel(90)).toBe("about every 3 months");
	});

	it("compares how long ago with the usual rhythm", () => {
		expect(freshness(10, 30)).toBe("fresh");
		expect(freshness(30, 30)).toBe("due");
		expect(freshness(50, 30)).toBe("overdue");
	});
});
