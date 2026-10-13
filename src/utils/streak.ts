import { addDays, fromDateKey, toDateKey, type DateKey } from "@/utils/date";

// Liczba dni z rzędu z co najmniej jednym wpisem. Dzisiejszy dzień „nie psuje”
// serii, dopóki trwa — liczymy od wczoraj i dodajemy dziś, jeśli coś jest.
export function countStreak(hasLogsOn: (key: DateKey) => boolean, today: DateKey): number {
	let count = hasLogsOn(today) ? 1 : 0;
	let day = addDays(fromDateKey(today), -1);
	while (hasLogsOn(toDateKey(day))) {
		count++;
		day = addDays(day, -1);
	}
	return count;
}

// Czy seria znajomego wciąż trwa z perspektywy naszego „dziś”
export function liveStreak(
	stats: { streak: number; streakEnd: DateKey } | null,
	today: DateKey,
): number {
	if (!stats) return 0;
	const yesterday = toDateKey(addDays(fromDateKey(today), -1));
	return stats.streakEnd >= yesterday ? stats.streak : 0;
}
