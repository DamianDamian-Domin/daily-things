import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import type { DayEntry, Habit, HabitLog } from "@/libs/types";
import { csvCell, exportFileName, habitsCsv, todosCsv } from "@/utils/csvExport";

afterEach(() => setLocale("en", { remember: false }));

const resolve = (log: HabitLog): Habit => ({
	name: log.name,
	icon: "star",
	severity: log.name === "Sweets" ? "danger" : "success",
	tags: [],
	origin: log.name === "Mine" ? "user" : "system",
	display_name: log.display_name ?? log.name,
});

const at = (y: number, mo: number, d: number, h: number, mi: number) =>
	new Date(y, mo - 1, d, h, mi).getTime();

describe("csvCell", () => {
	it("quotes commas, quotes and newlines", () => {
		expect(csvCell("plain")).toBe("plain");
		expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
		expect(csvCell("a\nb")).toBe('"a\nb"');
		expect(csvCell(undefined)).toBe("");
	});

	it("neutralises spreadsheet formulas", () => {
		expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
		expect(csvCell("-1")).toBe("'-1");
	});
});

describe("habitsCsv", () => {
	const days: Record<string, DayEntry> = {
		"2026-10-02": {
			date: "2026-10-02",
			habits: [
				{ id: "b", name: "Sweets", at: at(2026, 10, 2, 20, 5) },
				{ id: "a", name: "Gym", at: at(2026, 10, 2, 7, 30) },
			],
		},
		"2026-10-01": {
			date: "2026-10-01",
			habits: [{ id: "c", name: "Mine", display_name: "Fridge, clean", at: at(2026, 10, 1, 9, 0) }],
		},
	};

	it("lists check-ins oldest first with a BOM and header", () => {
		const csv = habitsCsv(days, resolve);
		expect(csv.startsWith("﻿")).toBe(true);
		expect(csv.slice(1).split("\r\n")).toEqual([
			"Date,Time,Habit,Type,Custom habit",
			'2026-10-01,09:00,"Fridge, clean",Build,yes',
			"2026-10-02,07:30,Gym,Build,no",
			"2026-10-02,20:05,Sweets,Cut back,no",
			"",
		]);
	});

	it("uses Polish headers in Polish", () => {
		setLocale("pl", { remember: false });
		const header = habitsCsv(days, resolve).slice(1).split("\r\n")[0];
		expect(header).toBe("Data,Godzina,Habit,Rodzaj,Własny habit");
	});
});

describe("todosCsv", () => {
	it("writes status, dates, subtasks and notes", () => {
		const csv = todosCsv([
			{
				id: "2",
				text: "Buy milk",
				completed: true,
				createdAt: at(2026, 10, 3, 8, 0),
				completedAt: at(2026, 10, 3, 18, 15),
			},
			{
				id: "1",
				text: "Plan trip",
				completed: false,
				createdAt: at(2026, 10, 1, 12, 0),
				description: "Mountains",
				subtasks: [
					{ id: "s1", text: "Tickets", done: true },
					{ id: "s2", text: "Hotel", done: false },
				],
			},
		]);
		expect(csv.slice(1).split("\r\n")).toEqual([
			"Task,Status,Created,Completed,Subtasks,Notes",
			"Plan trip,open,2026-10-01 12:00,,[x] Tickets; [ ] Hotel,Mountains",
			"Buy milk,done,2026-10-03 08:00,2026-10-03 18:15,,",
			"",
		]);
	});
});

describe("exportFileName", () => {
	it("includes the kind and date", () => {
		expect(exportFileName("habits", new Date(2026, 9, 14))).toBe("daily-things-habits-2026-10-14.csv");
		setLocale("pl", { remember: false });
		expect(exportFileName("todos", new Date(2026, 9, 4))).toBe("daily-things-zadania-2026-10-04.csv");
	});
});
