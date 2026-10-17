import { habitsMessages as m } from "@/i18n/messages/habits";

// Krótkie pochwały doklejane do komunikatu po odhaczeniu habitu
// (teksty w src/i18n/messages/habits.ts — cheers)
let last = -1;

export function randomCheer(): string {
	const cheers = m.cheers;
	let i = Math.floor(Math.random() * cheers.length);
	if (i === last) i = (i + 1) % cheers.length;
	last = i;
	return cheers[i];
}
