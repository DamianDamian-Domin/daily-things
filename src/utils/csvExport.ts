import type { DayEntry, Habit, HabitLog, TodoItem } from "@/libs/types";
import { exportMessages as m } from "@/i18n/messages/export";
import { isNativePlatform } from "@/utils/platform";

// ==========================================================================
// Eksport danych użytkownika do CSV (RFC 4180, przecinek, CRLF).
// BOM na początku, żeby Excel poprawnie pokazał polskie znaki.
// Nagłówki i wartości opisowe są w aktualnym języku aplikacji.
// ==========================================================================

type Cell = string | number | null | undefined;

export function csvCell(value: Cell): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	// Formuły w arkuszach („=…”) neutralizujemy apostrofem — ochrona przed CSV injection
	const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
	return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: Cell[][]): string {
	return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTime(ms: number | undefined): string {
	if (!ms) return "";
	const d = new Date(ms);
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(ms: number | undefined): string {
	if (!ms) return "";
	const d = new Date(ms);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${formatTime(ms)}`;
}

// Jeden wiersz na każde odhaczenie, od najstarszego
export function habitsCsv(
	days: Record<string, DayEntry>,
	resolve: (entry: HabitLog) => Habit,
): string {
	const rows: Cell[][] = [[m.colDate, m.colTime, m.colHabit, m.colType, m.colCustom]];
	const keys = Object.keys(days).sort();
	for (const key of keys) {
		const logs = [...(days[key]?.habits ?? [])].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
		for (const log of logs) {
			const habit = resolve(log);
			rows.push([
				key,
				formatTime(log.at),
				habit.display_name || habit.name,
				habit.severity === "danger" ? m.typeCutBack : m.typeBuild,
				habit.origin === "user" ? m.yes : m.no,
			]);
		}
	}
	return toCsv(rows);
}

export function todosCsv(todos: TodoItem[]): string {
	const rows: Cell[][] = [
		[m.colTask, m.colStatus, m.colCreated, m.colCompleted, m.colSubtasks, m.colNotes],
	];
	const sorted = [...todos].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
	for (const todo of sorted) {
		const subtasks = todo.subtasks ?? [];
		rows.push([
			todo.text,
			todo.completed ? m.statusDone : m.statusOpen,
			formatDateTime(todo.createdAt),
			todo.completed ? formatDateTime(todo.completedAt) : "",
			subtasks.length
				? subtasks.map((s) => `${s.done ? "[x]" : "[ ]"} ${s.text}`).join("; ")
				: "",
			todo.description ?? "",
		]);
	}
	return toCsv(rows);
}

export function exportFileName(kind: "habits" | "todos", now = new Date()): string {
	const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return `daily-things-${kind === "habits" ? m.fileHabits : m.fileTodos}-${date}.csv`;
}

// Pobranie pliku w przeglądarce; w aplikacji Android (WebView) próbujemy
// systemowego „Udostępnij”, bo zwykły link do pobrania tam nie działa.
export async function saveCsv(fileName: string, content: string): Promise<void> {
	const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
	const file = typeof File !== "undefined" ? new File([blob], fileName, { type: "text/csv" }) : null;
	if (isNativePlatform && file && navigator.canShare?.({ files: [file] })) {
		await navigator.share({ files: [file], title: fileName });
		return;
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
