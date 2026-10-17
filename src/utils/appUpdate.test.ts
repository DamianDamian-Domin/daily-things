import { describe, expect, it } from "vitest";
import { FRESH_START_MS, shouldApplyUpdateNow } from "./appUpdate";

describe("shouldApplyUpdateNow", () => {
	it("applies right after start, before the user does anything", () => {
		expect(shouldApplyUpdateNow({ msSinceStart: 800, interacted: false, hidden: false })).toBe(true);
	});

	it("waits once the user has started using the app", () => {
		expect(shouldApplyUpdateNow({ msSinceStart: 800, interacted: true, hidden: false })).toBe(false);
		expect(
			shouldApplyUpdateNow({ msSinceStart: FRESH_START_MS + 1, interacted: false, hidden: false }),
		).toBe(false);
	});

	it("applies whenever the app is in the background", () => {
		expect(shouldApplyUpdateNow({ msSinceStart: 60_000, interacted: true, hidden: true })).toBe(true);
	});
});
