import { describe, expect, it } from "vitest";
import { HELP_SLIDES, isReturningUser } from "./onboarding";

describe("isReturningUser", () => {
	it("treats an empty account as new", () => {
		expect(isReturningUser({ dailyGoals: [], recentHabits: [], dayCount: 0 })).toBe(false);
	});

	it("treats anyone with goals, recent habits or history as returning", () => {
		expect(isReturningUser({ dailyGoals: [{}], recentHabits: [], dayCount: 0 })).toBe(true);
		expect(isReturningUser({ dailyGoals: [], recentHabits: ["Walking"], dayCount: 0 })).toBe(true);
		expect(isReturningUser({ dailyGoals: [], recentHabits: [], dayCount: 3 })).toBe(true);
	});
});

describe("HELP_SLIDES", () => {
	it("has unique ids and non-empty copy", () => {
		const ids = HELP_SLIDES.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const slide of HELP_SLIDES) {
			expect(slide.title.trim()).not.toBe("");
			expect(slide.text.trim()).not.toBe("");
		}
	});
});
