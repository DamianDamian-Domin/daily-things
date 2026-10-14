import { describe, expect, it } from "vitest";
import type { GoalRef, Habit } from "@/libs/types";
import { buildWidgetState } from "@/utils/habitsWidget";
import { resolveHabit } from "@/utils/habitCatalog";
import { paletteColors, pixelSprite } from "@/utils/pixelIcons";

const custom: Habit = {
	name: "u_fridge",
	display_name: "Clean the fridge",
	icon: "kitchen",
	severity: "success",
	tags: [],
	origin: "user",
	category: "Your habits",
};
const resolve = (goal: GoalRef) => resolveHabit(goal, [custom]);

describe("buildWidgetState", () => {
	const state = buildWidgetState({
		date: "2026-10-14",
		goals: [
			{ id: "g1", name: "Gym" },
			{ id: "g2", name: "u_fridge" },
			{ id: "g3", name: "Gym" },
		],
		snapshot: [
			{ id: "g1", name: "Gym" },
			{ id: "g2", name: "u_fridge", icon: "kitchen", display_name: "Clean the fridge", origin: "user" },
			{ id: "g3", name: "Gym" },
		],
		logs: [
			{ id: "l1", name: "Gym", at: 1 },
			{ id: "l2", name: "Reading", at: 2 },
		],
		resolve,
	});

	it("groups repeated goals into one row with a target", () => {
		expect(state.goals.map((g) => [g.name, g.target])).toEqual([
			["Gym", 2],
			["u_fridge", 1],
		]);
	});

	it("keeps only today's logs of each goal", () => {
		expect(state.goals[0].logs).toEqual([{ id: "l1", name: "Gym", at: 1 }]);
		expect(state.goals[1].logs).toEqual([]);
	});

	it("carries labels, sprites and colours for native drawing", () => {
		expect(state.goals[1].label).toBe("Clean the fridge");
		expect(state.goals[1].sprite).toBe(pixelSprite("kitchen"));
		expect(state.goals[0].colors).toMatchObject({ o: expect.any(String), f: expect.any(String) });
		expect(state.ghost).toEqual(paletteColors("ghost"));
	});

	it("gives new widget logs the same extra fields the app writes", () => {
		expect(state.goals[0].extra).toEqual({});
		expect(state.goals[1].extra).toEqual({
			icon: "kitchen",
			display_name: "Clean the fridge",
			origin: "user",
		});
	});

	it("survives JSON round trip for the native side", () => {
		expect(JSON.parse(JSON.stringify(state))).toEqual(state);
	});
});
