// Krótki obrazkowy przewodnik po aplikacji. Pokazujemy go raz, nowym
// użytkownikom, a potem można go otworzyć z ustawień (Help).

export const ONBOARDING_STORAGE_KEY = "onboarding.v1";

export type HelpSlideId = "welcome" | "habits" | "days" | "todos" | "progress" | "friends";

export interface HelpSlide {
	id: HelpSlideId;
	title: string;
	text: string;
}

export const HELP_SLIDES: readonly HelpSlide[] = [
	{
		id: "welcome",
		title: "Welcome to Daily Things",
		text: "A cosy place for the small things you do every day: habits, to-dos and the friends cheering you on.",
	},
	{
		id: "habits",
		title: "Tap a tile when it's done",
		text: "Pick your daily goals from the catalogue or a starter pack, or make your own. One tap marks a habit for today.",
	},
	{
		id: "days",
		title: "Jump to any day",
		text: "Use the arrows or the calendar above your habits to look back at past days, or fill in something you forgot.",
	},
	{
		id: "todos",
		title: "Jot down to-dos",
		text: "One-off tasks live on the To-do card. Tick them off and they slide into the done list.",
	},
	{
		id: "progress",
		title: "Watch your streak grow",
		text: "Progress shows your streak, best habits and month at a glance. Collect badges and read a weekly recap.",
	},
	{
		id: "friends",
		title: "Better with friends",
		text: "Create an account, invite friends with a link, see each other's week, send a high-five or start a challenge together.",
	},
];

// Ktoś, kto już coś odhaczał albo ma wybrane cele, nie jest nowy —
// np. zalogował się na nowym urządzeniu. Jemu przewodnika nie wyskakujemy.
export function isReturningUser(data: {
	dailyGoals: readonly unknown[];
	recentHabits: readonly unknown[];
	dayCount: number;
}): boolean {
	return data.dailyGoals.length > 0 || data.recentHabits.length > 0 || data.dayCount > 0;
}
