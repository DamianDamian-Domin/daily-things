import { addDays, fromDateKey, toDateKey, type DateKey } from "@/utils/date";

// Jeden opuszczony dzień na 7 nie zrywa serii („zamrożenie” ❄️).
// Opuszczony dzień nie wlicza się do serii, tylko jej nie przerywa.
export const FREEZE_EVERY_DAYS = 7;

export interface StreakDetails {
	count: number; // dni z wpisem w serii
	startKey: DateKey | null; // najstarszy dzień serii
	frozen: DateKey[]; // dni „uratowane” zamrożeniem (od najnowszego)
}

export function streakDetails(
	hasLogsOn: (key: DateKey) => boolean,
	today: DateKey,
	maxDays = 3660,
): StreakDetails {
	let count = hasLogsOn(today) ? 1 : 0;
	let startKey: DateKey | null = count ? today : null;
	const frozen: DateKey[] = [];
	// Dzisiejszy dzień „nie psuje” serii, dopóki trwa — liczymy od wczoraj
	let day = addDays(fromDateKey(today), -1);
	let sinceFreeze = Infinity; // dni (wstecz) od ostatniego zamrożenia
	let pendingFreeze: DateKey | null = null;
	for (let i = 0; i < maxDays; i++) {
		const key = toDateKey(day);
		if (hasLogsOn(key)) {
			if (pendingFreeze) frozen.push(pendingFreeze);
			pendingFreeze = null;
			count++;
			startKey = key;
		} else if (!pendingFreeze && sinceFreeze >= FREEZE_EVERY_DAYS) {
			// Zamrożenie liczy się dopiero, gdy wcześniej był dzień z wpisem
			pendingFreeze = key;
			sinceFreeze = 0;
		} else {
			break;
		}
		sinceFreeze++;
		day = addDays(day, -1);
	}
	if (count === 0) return { count: 0, startKey: null, frozen: [] };
	return { count, startKey, frozen };
}

export function countStreak(hasLogsOn: (key: DateKey) => boolean, today: DateKey): number {
	return streakDetails(hasLogsOn, today).count;
}

// Najdłuższa seria w podanych (posortowanych) dniach z wpisem — bez zamrożeń
export function longestRun(keys: DateKey[]): number {
	let best = 0;
	let run = 0;
	let prev: DateKey | null = null;
	for (const key of [...keys].sort()) {
		if (prev && toDateKey(addDays(fromDateKey(prev), 1)) === key) run++;
		else if (prev !== key) run = 1;
		prev = key;
		best = Math.max(best, run);
	}
	return best;
}
