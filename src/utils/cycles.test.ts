import { describe, expect, it } from "vitest";
import type { HabitCycle } from "@/libs/types";
import {
	addInterval,
	cycleStatus,
	dueLabel,
	dueShort,
	everyLabel,
	everyShort,
	isValidCycle,
	shouldNudge,
} from "@/utils/cycles";

const cycle = (every: number, unit: HabitCycle["unit"], anchor = "2026-09-01"): HabitCycle => ({
	name: "Clean the fridge",
	every,
	unit,
	anchor,
});

describe("addInterval", () => {
	it("adds days and weeks", () => {
		expect(addInterval("2026-10-14", 3, "day")).toBe("2026-10-17");
		expect(addInterval("2026-10-14", 4, "week")).toBe("2026-11-11");
	});

	it("adds calendar months and clamps to the month's last day", () => {
		expect(addInterval("2026-10-14", 3, "month")).toBe("2027-01-14");
		expect(addInterval("2026-01-31", 1, "month")).toBe("2026-02-28");
		expect(addInterval("2028-01-31", 1, "month")).toBe("2028-02-29");
	});

	it("is not thrown off by a DST change", () => {
		expect(addInterval("2026-10-20", 1, "week")).toBe("2026-10-27");
	});
});

describe("cycleStatus", () => {
	it("counts from the newest log after the anchor", () => {
		const s = cycleStatus(cycle(4, "week"), "2026-10-01", "2026-10-14");
		expect(s).toEqual({ last: "2026-10-01", due: "2026-10-29", daysLeft: 15, state: "ok" });
	});

	it("falls back to the anchor when nothing newer is logged", () => {
		const s = cycleStatus(cycle(2, "week", "2026-10-01"), "2026-08-01", "2026-10-14");
		expect(s.last).toBe("2026-10-01");
		expect(s.due).toBe("2026-10-15");
		expect(s.state).toBe("soon");
	});

	it("marks today and overdue", () => {
		expect(cycleStatus(cycle(1, "week", "2026-10-07"), null, "2026-10-14").state).toBe("today");
		const late = cycleStatus(cycle(1, "week", "2026-10-01"), null, "2026-10-14");
		expect(late.state).toBe("overdue");
		expect(late.daysLeft).toBe(-6);
	});

	it("never calls an every-day chore 'soon'", () => {
		expect(cycleStatus(cycle(1, "day", "2026-10-13"), null, "2026-10-13").state).toBe("ok");
	});
});

describe("labels", () => {
	it("describes the interval", () => {
		expect(everyLabel({ every: 1, unit: "week" })).toBe("Every week");
		expect(everyLabel({ every: 4, unit: "week" })).toBe("Every 4 weeks");
		expect(everyShort({ every: 3, unit: "month" })).toBe("3mo");
	});

	it("describes the due date", () => {
		expect(dueLabel({ daysLeft: 0 })).toBe("due today");
		expect(dueLabel({ daysLeft: 1 })).toBe("due tomorrow");
		expect(dueLabel({ daysLeft: 20 })).toBe("due in 3 weeks");
		expect(dueLabel({ daysLeft: -1 })).toBe("1 day overdue");
		expect(dueLabel({ daysLeft: -5 })).toBe("5 days overdue");
		expect(dueShort({ daysLeft: 5 })).toBe("in 5d");
		expect(dueShort({ daysLeft: -21 })).toBe("3w late");
		expect(dueShort({ daysLeft: 0 })).toBe("today");
	});
});

describe("isValidCycle", () => {
	it("accepts a stored cycle and rejects broken ones", () => {
		expect(isValidCycle(cycle(4, "week"))).toBe(true);
		expect(isValidCycle({ ...cycle(4, "week"), every: 0 })).toBe(false);
		expect(isValidCycle({ ...cycle(4, "week"), unit: "year" })).toBe(false);
		expect(isValidCycle({ ...cycle(4, "week"), anchor: "yesterday" })).toBe(false);
		expect(isValidCycle({ ...cycle(100, "month") })).toBe(false);
		expect(isValidCycle(null)).toBe(false);
	});
});

describe("shouldNudge", () => {
	it("nudges on the due day and every third day after", () => {
		expect([2, 1, 0, -1, -2, -3, -6].map(shouldNudge)).toEqual([false, false, true, false, false, true, true]);
	});
});
