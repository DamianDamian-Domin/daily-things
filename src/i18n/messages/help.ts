import { defineMessages } from "@/i18n";
import type { HelpSlideId } from "@/utils/onboarding";

// Przewodnik „Jak to działa” (HelpTour + ilustracje)
export const helpMessages = defineMessages(
	{
		closeHelp: "Close help",
		choosePage: "Choose a page",
		slideOf: (i: number, total: number) => `${i} of ${total}`,
		skip: "Skip",
		next: "Next",
		letsGo: "Let's go",
		// Ilustracje
		tilesCaption: "3 of 6 today",
		dayName: "Saturday",
		dayDate: "11 October",
		weekLetters: ["M", "T", "W", "T", "F", "S", "S"],
		todos: ["Clean the fridge", "Book the dentist", "Buy a birthday card"],
		dayStreak: "day streak",
		you: "You",
	},
	{
		closeHelp: "Zamknij przewodnik",
		choosePage: "Wybierz stronę",
		slideOf: (i, total) => `${i} z ${total}`,
		skip: "Pomiń",
		next: "Dalej",
		letsGo: "Zaczynamy",
		tilesCaption: "3 z 6 dziś",
		dayName: "Sobota",
		dayDate: "11 października",
		weekLetters: ["P", "W", "Ś", "C", "P", "S", "N"],
		todos: ["Umyć lodówkę", "Umówić dentystę", "Kupić kartkę urodzinową"],
		dayStreak: "dni z rzędu",
		you: "Ty",
	},
);

// Polskie teksty slajdów przewodnika (angielskie są w utils/onboarding.ts)
export const HELP_SLIDES_PL: Record<HelpSlideId, { title: string; text: string }> = {
	welcome: {
		title: "Witaj w Daily Things",
		text: "Przytulne miejsce na drobne rzeczy, które robisz codziennie: habity, zadania i znajomych, którzy ci kibicują.",
	},
	habits: {
		title: "Stuknij kafelek, gdy gotowe",
		text: "Wybierz cele dzienne z katalogu lub pakietu startowego albo stwórz własne. Jedno stuknięcie zapisuje habit na dziś.",
	},
	days: {
		title: "Przejdź do dowolnego dnia",
		text: "Strzałkami albo kalendarzem nad habitami wrócisz do minionych dni i uzupełnisz to, co umknęło.",
	},
	todos: {
		title: "Zapisuj zadania",
		text: "Jednorazowe sprawy trzymasz na karcie z zadaniami. Odhacz je, a przejdą na listę zrobionych.",
	},
	progress: {
		title: "Patrz, jak rośnie seria",
		text: "Postępy pokazują twoją serię, najlepsze habity i cały miesiąc w skrócie. Zbieraj odznaki i czytaj podsumowanie tygodnia.",
	},
	friends: {
		title: "Ze znajomymi raźniej",
		text: "Załóż konto, zaproś znajomych linkiem, zaglądajcie sobie nawzajem w tydzień i przybijajcie piątki.",
	},
};
