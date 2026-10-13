import { describe, expect, it } from "vitest";
import { countStreak, liveStreak } from "@/utils/streak";

const logged = (...keys: string[]) => {
	const set = new Set(keys);
	return (key: string) => set.has(key);
};

describe("countStreak", () => {
	it("is zero with no logs", () => {
		expect(countStreak(logged(), "2026-10-13")).toBe(0);
	});

	it("counts today alone", () => {
		expect(countStreak(logged("2026-10-13"), "2026-10-13")).toBe(1);
	});

	it("keeps a streak alive while today has no logs yet", () => {
		expect(countStreak(logged("2026-10-11", "2026-10-12"), "2026-10-13")).toBe(2);
	});

	it("adds today on top of the run up to yesterday", () => {
		expect(countStreak(logged("2026-10-11", "2026-10-12", "2026-10-13"), "2026-10-13")).toBe(3);
	});

	it("stops at the first gap", () => {
		expect(countStreak(logged("2026-10-09", "2026-10-11", "2026-10-12"), "2026-10-13")).toBe(2);
	});

	it("is broken when yesterday was missed", () => {
		expect(countStreak(logged("2026-10-10", "2026-10-11"), "2026-10-13")).toBe(0);
		expect(countStreak(logged("2026-10-11", "2026-10-13"), "2026-10-13")).toBe(1);
	});

	it("runs across month and year boundaries", () => {
		expect(
			countStreak(logged("2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"), "2026-01-02"),
		).toBe(4);
	});
});

describe("liveStreak", () => {
	it("is zero without stats", () => {
		expect(liveStreak(null, "2026-10-13")).toBe(0);
	});

	it("keeps a streak that ended today or yesterday", () => {
		expect(liveStreak({ streak: 5, streakEnd: "2026-10-13" }, "2026-10-13")).toBe(5);
		expect(liveStreak({ streak: 5, streakEnd: "2026-10-12" }, "2026-10-13")).toBe(5);
	});

	it("drops a streak that ended earlier", () => {
		expect(liveStreak({ streak: 5, streakEnd: "2026-10-11" }, "2026-10-13")).toBe(0);
	});

	it("handles the year boundary", () => {
		expect(liveStreak({ streak: 3, streakEnd: "2025-12-31" }, "2026-01-01")).toBe(3);
	});
});
