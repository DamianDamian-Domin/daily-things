// Krótkie pochwały doklejane do komunikatu po odhaczeniu habitu
const CHEERS = [
	"nice! 💪",
	"keep it up! 🔥",
	"well done! ✨",
	"one step forward 🚀",
	"lovely 🌸",
	"spot on 🎯",
	"you've got this 💫",
	"that's the spirit ⚡",
	"treat yourself to a coffee ☕",
	"growing nicely 🌿",
	"great work 👏",
	"so good 🍀",
];

let last = -1;

export function randomCheer(): string {
	let i = Math.floor(Math.random() * CHEERS.length);
	if (i === last) i = (i + 1) % CHEERS.length;
	last = i;
	return CHEERS[i];
}
