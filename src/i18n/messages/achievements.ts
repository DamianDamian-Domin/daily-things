import { defineMessages, plPlural } from "@/i18n";

// Odznaki: okno z kolekcją i toasty po zdobyciu
export const achievementsMessages = defineMessages(
	{
		title: "Your badges",
		collected: (earned: number, total: number) => `${earned} of ${total} collected`,
		meterAria: "Badges collected",
		progressAria: (current: number, target: number) => `${current} of ${target}`,
		earned: "Earned",
		earnedOn: (date: string) => `Earned ${date}`,
		see: "See",
		alreadyEarned: (n: number) => `You've already earned ${n} ${n === 1 ? "badge" : "badges"} 🏅`,
		manyUnlocked: (n: number) => `${n} new badges unlocked 🏅`,
		unlocked: (title: string) => `Badge unlocked: ${title} 🏅`,
	},
	{
		title: "Twoje odznaki",
		collected: (earned, total) => `Zebrane: ${earned} z ${total}`,
		meterAria: "Zebrane odznaki",
		progressAria: (current, target) => `${current} z ${target}`,
		earned: "Zdobyta",
		earnedOn: (date) => `Zdobyta ${date}`,
		see: "Zobacz",
		alreadyEarned: (n) => `Masz już ${n} ${plPlural(n, "odznakę", "odznaki", "odznak")} 🏅`,
		manyUnlocked: (n) => `${n} ${plPlural(n, "nowa odznaka", "nowe odznaki", "nowych odznak")} 🏅`,
		unlocked: (title) => `Nowa odznaka: ${title} 🏅`,
	},
);

// Polskie nazwy i opisy odznak (id → tekst). Angielskie zostają w
// utils/achievements.ts, tam też pola zamieniamy na gettery wg języka.
export const ACHIEVEMENTS_PL: Record<string, { title: string; description: string }> = {
	first_step: { title: "Pierwszy krok", description: "Zapisz swój pierwszy habit" },
	goal_setter: { title: "Mam cel", description: "Wybierz swój pierwszy cel dzienny" },
	perfect_day: { title: "Idealny dzień", description: "Zrób wszystkie cele jednego dnia" },
	streak_3: { title: "Rozgrzewka", description: "Utrzymaj serię przez 3 dni" },
	streak_7: { title: "Cały tydzień", description: "Utrzymaj serię przez 7 dni" },
	streak_30: { title: "Nie do zatrzymania", description: "Utrzymaj serię przez 30 dni" },
	perfect_week: { title: "Idealny tydzień", description: "Każdy cel, od poniedziałku do niedzieli" },
	weekend: { title: "Weekendowy wojownik", description: "Wszystkie cele w sobotę i niedzielę" },
	perfect_10: { title: "Dziesięć na dziesięć", description: "Zbierz 10 idealnych dni" },
	checkins_50: { title: "Pół setki", description: "Zapisz 50 dobrych habitów" },
	checkins_250: { title: "Maszyna do habitów", description: "Zapisz 250 dobrych habitów" },
	early_bird: { title: "Ranny ptaszek", description: "Zapisz 5 habitów przed 8:00" },
	night_owl: { title: "Nocny marek", description: "Zapisz 5 habitów po 22:00" },
	explorer: { title: "Odkrywca", description: "Wypróbuj habity z 5 różnych obszarów" },
	creator: { title: "Po swojemu", description: "Stwórz własny habit" },
	comeback: { title: "Witaj z powrotem", description: "Wróć do działania po przerwie" },
	friends: { title: "Razem raźniej", description: "Dodaj pierwszego znajomego" },
};
