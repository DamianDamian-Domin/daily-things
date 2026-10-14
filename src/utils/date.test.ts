import { describe, expect, it } from "vitest";
import {
	addDays,
	daysInRange,
	fromDateKey,
	isoWeek,
	isSameDay,
	monthBounds,
	monthKeyOf,
	monthsInRange,
	partOfDay,
	startOfDay,
	startOfWeek,
	toDateKey,
} from "@/utils/date";

describe("toDateKey / fromDateKey", () => {
	it("formats in local time with zero padding", () => {
		expect(toDateKey(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
		expect(toDateKey(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
	});

	it("round-trips to local midnight", () => {
		const d = fromDateKey("2026-03-29");
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(2);
		expect(d.getDate()).toBe(29);
		expect(d.getHours()).toBe(0);
		expect(toDateKey(d)).toBe("2026-03-29");
	});
});

describe("startOfDay / addDays / isSameDay", () => {
	it("drops the time part", () => {
		expect(startOfDay(new Date(2026, 4, 10, 18, 45)).getTime()).toBe(
			new Date(2026, 4, 10).getTime(),
		);
	});

	it("crosses month and year boundaries", () => {
		expect(toDateKey(addDays(new Date(2026, 0, 31), 1))).toBe("2026-02-01");
		expect(toDateKey(addDays(new Date(2026, 0, 1), -1))).toBe("2025-12-31");
		expect(toDateKey(addDays(new Date(2028, 1, 28), 1))).toBe("2028-02-29");
	});

	it("moves by calendar days across DST changes", () => {
		expect(toDateKey(addDays(new Date(2026, 2, 28), 2))).toBe("2026-03-30");
		expect(toDateKey(addDays(new Date(2026, 9, 24), 2))).toBe("2026-10-26");
	});

	it("compares calendar days, ignoring time", () => {
		expect(isSameDay(new Date(2026, 5, 1, 0, 1), new Date(2026, 5, 1, 23, 59))).toBe(true);
		expect(isSameDay(new Date(2026, 5, 1, 23, 59), new Date(2026, 5, 2, 0, 0))).toBe(false);
	});
});

describe("months", () => {
	it("builds a month key", () => {
		expect(monthKeyOf(new Date(2026, 8, 15))).toBe("2026-09");
	});

	it("returns first and last day of a month", () => {
		expect(monthBounds(2026, 1)).toMatchObject({ startKey: "2026-02-01", endKey: "2026-02-28" });
		expect(monthBounds(2028, 1).endKey).toBe("2028-02-29");
		expect(monthBounds(2026, 11).endKey).toBe("2026-12-31");
	});

	it("lists every month covering a range, across years", () => {
		expect(monthsInRange(new Date(2025, 10, 20), new Date(2026, 1, 3))).toEqual([
			[2025, 10],
			[2025, 11],
			[2026, 0],
			[2026, 1],
		]);
		expect(monthsInRange(new Date(2026, 4, 1), new Date(2026, 4, 31))).toEqual([[2026, 4]]);
		expect(monthsInRange(new Date(2026, 4, 1), new Date(2026, 3, 1))).toEqual([]);
	});
});

describe("daysInRange", () => {
	it("includes both ends", () => {
		expect(daysInRange(new Date(2026, 1, 27), new Date(2026, 2, 2)).map(toDateKey)).toEqual([
			"2026-02-27",
			"2026-02-28",
			"2026-03-01",
			"2026-03-02",
		]);
	});

	it("is empty when start is after end", () => {
		expect(daysInRange(new Date(2026, 1, 2), new Date(2026, 1, 1))).toEqual([]);
	});
});

describe("weeks", () => {
	it("starts the week on Monday", () => {
		// 2026-10-13 is a Tuesday, 2026-10-18 a Sunday
		expect(toDateKey(startOfWeek(new Date(2026, 9, 13, 15)))).toBe("2026-10-12");
		expect(toDateKey(startOfWeek(new Date(2026, 9, 18)))).toBe("2026-10-12");
		expect(toDateKey(startOfWeek(new Date(2026, 9, 12)))).toBe("2026-10-12");
	});

	it("computes ISO week numbers, including year edges", () => {
		expect(isoWeek(new Date(2026, 9, 13))).toBe(42);
		expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
		expect(isoWeek(new Date(2021, 0, 3))).toBe(53);
		expect(isoWeek(new Date(2024, 11, 30))).toBe(1);
	});
});

describe("partOfDay", () => {
	it.each([
		[3, "Good night"],
		[5, "Good morning"],
		[11, "Good morning"],
		[12, "Good afternoon"],
		[17, "Good afternoon"],
		[18, "Good evening"],
	])("at %i:00 says %s", (hour, greeting) => {
		expect(partOfDay(new Date(2026, 0, 1, hour)).greeting).toBe(greeting);
	});
});
