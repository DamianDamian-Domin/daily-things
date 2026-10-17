import { describe, expect, it } from "vitest";
import {
	checkableDays,
	challengeDays,
	dayNumber,
	daysLabel,
	endKey,
	isStale,
	phaseOf,
	teamMessage,
	teamProgress,
	toChallenge,
	type Challenge,
} from "@/utils/challenges";

const base = (over: Partial<Challenge> = {}): Challenge => ({
	id: "c1",
	title: "No sweets",
	icon: "cookie",
	palette: "pink",
	days: 7,
	start: "2026-10-10",
	createdBy: "a",
	members: ["a", "b", "c"],
	joined: ["a", "b"],
	people: { a: { name: "Ania", avatar: null }, b: { name: "Bartek", avatar: null }, c: { name: "Celina", avatar: null } },
	checkins: { a: [], b: [] },
	...over,
});

describe("challenge calendar", () => {
	it("computes the last day and the list of days", () => {
		expect(endKey(base())).toBe("2026-10-16");
		expect(challengeDays(base())).toEqual([
			"2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13",
			"2026-10-14", "2026-10-15", "2026-10-16",
		]);
	});

	it("crosses month boundaries", () => {
		expect(endKey({ start: "2026-10-28", days: 7 })).toBe("2026-11-03");
	});

	it("knows the phase and day number", () => {
		const c = base();
		expect(phaseOf(c, "2026-10-09")).toBe("upcoming");
		expect(dayNumber(c, "2026-10-09")).toBe(0);
		expect(phaseOf(c, "2026-10-10")).toBe("active");
		expect(dayNumber(c, "2026-10-10")).toBe(1);
		expect(dayNumber(c, "2026-10-16")).toBe(7);
		expect(phaseOf(c, "2026-10-17")).toBe("finished");
		expect(dayNumber(c, "2026-10-20")).toBe(7);
	});

	it("lets you check in today and yesterday, inside the challenge only", () => {
		const c = base();
		expect(checkableDays(c, "2026-10-10")).toEqual(["2026-10-10"]);
		expect(checkableDays(c, "2026-10-12")).toEqual(["2026-10-11", "2026-10-12"]);
		expect(checkableDays(c, "2026-10-17")).toEqual(["2026-10-16"]);
		expect(checkableDays(c, "2026-10-18")).toEqual([]);
	});

	it("hides challenges a week after they end", () => {
		const c = base();
		expect(isStale(c, "2026-10-23")).toBe(false);
		expect(isStale(c, "2026-10-24")).toBe(true);
	});

	it("labels the day", () => {
		expect(daysLabel(base(), "2026-10-12")).toBe("Day 3 of 7");
		expect(daysLabel(base(), "2026-10-16")).toBe("Day 7 of 7 · last day");
		expect(daysLabel(base(), "2026-10-30")).toBe("7 days · finished");
	});
});

describe("teamProgress", () => {
	it("counts only people who joined", () => {
		const c = base({
			checkins: { a: ["2026-10-10", "2026-10-11"], b: ["2026-10-10"] },
		});
		expect(teamProgress(c, "2026-10-11")).toEqual({ done: 3, total: 14, pct: 21, expected: 2 });
	});

	it("is empty without participants", () => {
		expect(teamProgress(base({ joined: [], checkins: {} }), "2026-10-11").pct).toBe(0);
	});
});

describe("teamMessage", () => {
	it("describes today", () => {
		expect(teamMessage(base(), "2026-10-11")).toBe("Nobody's checked in today yet");
		expect(teamMessage(base({ checkins: { a: ["2026-10-11"], b: [] } }), "2026-10-11")).toBe("1 of 2 done today");
		expect(
			teamMessage(base({ checkins: { a: ["2026-10-11"], b: ["2026-10-11"] } }), "2026-10-11"),
		).toBe("Everyone's done today ✨");
		expect(teamMessage(base({ joined: ["a"], checkins: { a: [] } }), "2026-10-11")).toBe(
			"Waiting for friends to join 💌",
		);
	});

	it("celebrates a perfect finish", () => {
		const all = challengeDays(base());
		expect(teamMessage(base({ checkins: { a: all, b: all } }), "2026-10-20")).toBe(
			"Every single day, together 🏆",
		);
	});
});

describe("toChallenge", () => {
	const raw = {
		title: "  No sweets  ",
		icon: "cookie",
		palette: "pink",
		days: 7,
		start: "2026-10-10",
		createdBy: "a",
		members: ["a", "b", "b", 3],
		joined: ["a", "x"],
		people: { a: { name: "Ania" } },
		checkins: { a: ["2026-10-09", "2026-10-11", "2026-10-10", 5], b: ["2026-10-10"] },
	};

	it("cleans untrusted data", () => {
		const c = toChallenge("id", raw)!;
		expect(c.title).toBe("No sweets");
		expect(c.members).toEqual(["a", "b"]);
		expect(c.joined).toEqual(["a"]);
		expect(c.people.b.name).toBe("Friend");
		// Dzień przed startem odpada, a osoby spoza „joined” nie mają postępu
		expect(c.checkins).toEqual({ a: ["2026-10-10", "2026-10-11"] });
	});

	it("rejects broken documents", () => {
		expect(toChallenge("id", undefined)).toBeNull();
		expect(toChallenge("id", { ...raw, days: 400 })).toBeNull();
		expect(toChallenge("id", { ...raw, start: "soon" })).toBeNull();
		expect(toChallenge("id", { ...raw, members: [] })).toBeNull();
	});

	it("falls back to safe icon and palette", () => {
		const c = toChallenge("id", { ...raw, icon: "", palette: "neon" })!;
		expect(c.icon).toBe("flag");
		expect(c.palette).toBe("green");
	});
});
