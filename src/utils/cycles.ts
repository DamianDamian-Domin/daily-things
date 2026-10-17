// Obowiązki cykliczne: habit, który robi się co jakiś czas (lodówka co
// 4 tygodnie, pościel co 2 tygodnie). Nie jest celem dziennym — aplikacja
// pilnuje terminu i przypomina, gdy minie. Czysta logika bez Firebase.
import type { HabitCycle } from "@/libs/types";
import { addDays, fromDateKey, toDateKey, type DateKey } from "@/utils/date";
import { daysBetween } from "@/utils/lastDone";

export type CycleUnit = HabitCycle["unit"];
export type CycleState = "ok" | "soon" | "today" | "overdue";

export const CYCLE_UNITS: CycleUnit[] = ["day", "week", "month"];
export const MAX_EVERY: Record<CycleUnit, number> = { day: 365, week: 52, month: 24 };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Gotowe odstępy do jednego stuknięcia
export const CYCLE_PRESETS: Array<Pick<HabitCycle, "every" | "unit">> = [
	{ every: 1, unit: "week" },
	{ every: 2, unit: "week" },
	{ every: 4, unit: "week" },
	{ every: 3, unit: "month" },
	{ every: 6, unit: "month" },
];

export function isValidCycle(c: unknown): c is HabitCycle {
	const item = c as HabitCycle;
	return (
		typeof item?.name === "string" &&
		CYCLE_UNITS.includes(item.unit) &&
		Number.isInteger(item.every) &&
		item.every >= 1 &&
		item.every <= MAX_EVERY[item.unit] &&
		typeof item.anchor === "string" &&
		DATE_RE.test(item.anchor)
	);
}

// Termin = ostatni raz + odstęp. Miesiące liczymy kalendarzowo, a 31 stycznia
// + 1 miesiąc to ostatni dzień lutego, nie 3 marca.
export function addInterval(from: DateKey, every: number, unit: CycleUnit): DateKey {
	const date = fromDateKey(from);
	if (unit === "day") return toDateKey(addDays(date, every));
	if (unit === "week") return toDateKey(addDays(date, every * 7));
	const target = new Date(date.getFullYear(), date.getMonth() + every, 1);
	const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
	target.setDate(Math.min(date.getDate(), lastDay));
	return toDateKey(target);
}

export interface CycleStatus {
	// Ostatni raz (z historii albo moment ustawienia cyklu)
	last: DateKey;
	due: DateKey;
	// Dni do terminu: 0 = dziś, ujemne = po terminie
	daysLeft: number;
	state: CycleState;
}

// „Wkrótce” = w ostatniej części odstępu, ale nie wcześniej niż 3 dni przed
function soonWindow(cycle: HabitCycle): number {
	if (cycle.unit === "day") return Math.min(1, cycle.every - 1);
	return 3;
}

// `lastLogged` to najnowszy dzień z wpisem (bez przyszłych dni), o ile jest
export function cycleStatus(cycle: HabitCycle, lastLogged: DateKey | null, today: DateKey): CycleStatus {
	const last = lastLogged && lastLogged > cycle.anchor ? lastLogged : cycle.anchor;
	const due = addInterval(last, cycle.every, cycle.unit);
	const daysLeft = daysBetween(today, due);
	let state: CycleState = "ok";
	if (daysLeft < 0) state = "overdue";
	else if (daysLeft === 0) state = "today";
	else if (daysLeft <= soonWindow(cycle)) state = "soon";
	return { last, due, daysLeft, state };
}

export function everyLabel(cycle: Pick<HabitCycle, "every" | "unit">): string {
	if (cycle.every === 1) return cycle.unit === "day" ? "Every day" : `Every ${cycle.unit}`;
	return `Every ${cycle.every} ${cycle.unit}s`;
}

export function everyShort(cycle: Pick<HabitCycle, "every" | "unit">): string {
	const unit = cycle.unit === "day" ? "d" : cycle.unit === "week" ? "w" : "mo";
	return `${cycle.every}${unit}`;
}

export function dueLabel(status: Pick<CycleStatus, "daysLeft">): string {
	const d = status.daysLeft;
	if (d === 0) return "due today";
	if (d === 1) return "due tomorrow";
	if (d > 1) return d < 14 ? `due in ${d} days` : `due in ${Math.round(d / 7)} weeks`;
	if (d === -1) return "1 day overdue";
	return -d < 14 ? `${-d} days overdue` : `${Math.round(-d / 7)} weeks overdue`;
}

// Plakietka w wierszu: „in 5d”, „today”, „3d late”
export function dueShort(status: Pick<CycleStatus, "daysLeft">): string {
	const d = status.daysLeft;
	if (d === 0) return "today";
	const abs = Math.abs(d);
	const amount = abs < 14 ? `${abs}d` : abs < 60 ? `${Math.round(abs / 7)}w` : `${Math.round(abs / 30.44)}mo`;
	return d > 0 ? `in ${amount}` : `${amount} late`;
}

export function sameCycle(a: Pick<HabitCycle, "every" | "unit">, b: Pick<HabitCycle, "every" | "unit">) {
	return a.every === b.every && a.unit === b.unit;
}

// Dni, w które przypominamy (oprócz samego terminu): po terminie co 3 dni,
// żeby nie zasypywać powiadomieniami, ale też nie zapomnieć o lodówce na pół roku
export function shouldNudge(daysLeft: number): boolean {
	if (daysLeft > 0) return false;
	return -daysLeft % 3 === 0;
}
