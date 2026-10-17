import { describe, expect, it } from "vitest";
import {
	isDueOn,
	isRestDay,
	isWeekly,
	normalizeSchedule,
	scheduleLabel,
	weekKeys,
	weekdayIndex,
} from "@/utils/goalSchedule";

// 2026-10-12 to poniedziałek
const MON = "2026-10-12";
const TUE = "2026-10-13";
const SUN = "2026-10-18";

describe("weekdayIndex / weekKeys", () => {
	it("starts the week on Monday", () => {
		expect(weekdayIndex(MON)).toBe(0);
		expect(weekdayIndex(SUN)).toBe(6);
		expect(weekKeys("2026-10-15")).toEqual([
			"2026-10-12",
			"2026-10-13",
			"2026-10-14",
			"2026-10-15",
			"2026-10-16",
			"2026-10-17",
			"2026-10-18",
		]);
	});
});

describe("normalizeSchedule", () => {
	it("treats no days or all seven days as every day", () => {
		expect(normalizeSchedule(undefined)).toBeUndefined();
		expect(normalizeSchedule({ kind: "days", days: [] })).toBeUndefined();
		expect(normalizeSchedule({ kind: "days", days: [0, 1, 2, 3, 4, 5, 6] })).toBeUndefined();
	});

	it("sorts, dedupes and drops invalid days", () => {
		expect(normalizeSchedule({ kind: "days", days: [4, 0, 4, 9, 2] })).toEqual({
			kind: "days",
			days: [0, 2, 4],
		});
	});

	it("clamps weekly times", () => {
		expect(normalizeSchedule({ kind: "weekly", times: 0 })).toEqual({ kind: "weekly", times: 1 });
		expect(normalizeSchedule({ kind: "weekly", times: 12 })).toEqual({ kind: "weekly", times: 6 });
	});
});

describe("isDueOn / isRestDay", () => {
	const gym = { name: "gym", schedule: { kind: "days" as const, days: [0, 2, 4] } };
	const run = { name: "run", schedule: { kind: "weekly" as const, times: 3 } };
	const water = { name: "water" };

	it("only shows day-planned goals on their days", () => {
		expect(isDueOn(gym, MON)).toBe(true);
		expect(isDueOn(gym, TUE)).toBe(false);
		expect(isDueOn(water, TUE)).toBe(true);
		expect(isDueOn(run, MON)).toBe(false);
		expect(isWeekly(run)).toBe(true);
	});

	it("is a rest day only when every goal is planned for other days", () => {
		expect(isRestDay([gym], TUE)).toBe(true);
		expect(isRestDay([gym], MON)).toBe(false);
		expect(isRestDay([gym, water], TUE)).toBe(false);
		expect(isRestDay([gym, run], TUE)).toBe(false);
		expect(isRestDay([], TUE)).toBe(false);
	});
});

describe("scheduleLabel", () => {
	it("describes the rhythm", () => {
		expect(scheduleLabel(undefined)).toBe("Every day");
		expect(scheduleLabel({ kind: "days", days: [0, 1, 2, 3, 4] })).toBe("Weekdays");
		expect(scheduleLabel({ kind: "days", days: [5, 6] })).toBe("Weekends");
		expect(scheduleLabel({ kind: "days", days: [0, 2, 4] })).toBe("Mon · Wed · Fri");
		expect(scheduleLabel({ kind: "weekly", times: 3 })).toBe("3× a week");
	});
});
