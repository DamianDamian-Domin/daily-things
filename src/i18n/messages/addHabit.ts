import { defineMessages, enPlural, plPlural } from "@/i18n";

const plTimes = (n: number) => plPlural(n, "raz", "razy", "razy");

// Okno dodawania habitów / celów (AddHabitDialog + add_habit/*)
export const addHabitMessages = defineMessages(
	{
		yourDailyGoals: "Your daily goals",
		logTitleToday: "What did you do today?",
		logTitleThatDay: "What did you do that day?",
		logSubtitle: "Tap to log. Tap again if you did it more than once.",
		goalSubtitle: "Tap to add a goal. Tap again to aim for it several times a day.",
		searchPlaceholder: (n: number) => `Search ${n} habits…`,
		searchAria: "Search habits",
		breakHint: "Noticing a slip is the first step to changing it. Log it kindly 🌱",
		seeMatches: (n: number) => `See ${n} ${enPlural(n, "match", "matches")} in all categories`,
		done: "Done",
		allHabits: "All habits",
		allShort: "All",
		habitsToBreak: "Habits to break",
		breakShort: "Break",
		found: (n: number, where?: string) => `${n} found${where ? ` in ${where}` : ""}`,
		yourGoals: "Your goals",
		recentlyUsed: "Recently used",
		greatToStart: "Great to start with",
		noBreakMatch: (q: string) => `No habits to break match “${q}”.`,
		noBreak: "No habits to break here — lovely! 🌿",
		noInCategory: (q: string, label: string) => `No “${q}” in ${label}.`,
		nothingCalled: (q: string) => `Nothing called “${q}” yet.`,
		nothingHere: "Nothing here yet.",
		goalsADay: (n: number) => `${n} ${enPlural(n, "goal", "goals")} a day`,
		noGoals: "No goals yet",
		nothingAdded: "Nothing added yet",
		added: (n: number) => `${n} added — nice! ✨`,

		// Półka kategorii
		category: "Category",

		// Zaproszenie do tworzenia
		createNamed: (q: string) => `Create “${q}”`,
		createOwn: "Create your own habit",
		cutBack: "Something else you'd like to cut back on?",
		cantFind: "Can't find it? Make it yours.",

		// Formularz własnego habitu
		nameYourHabit: "Name your habit",
		namePlaceholder: "e.g. Practice guitar",
		pickIcon: "Pick an icon",
		wantToBreak: "It's a habit I want to break",
		createAndLog: "Create & log",
		createAndGoal: "Create & add goal",

		// Sekcje
		manage: "Manage",
		deleteHabit: (name: string) => `Delete ${name}`,
		removeOneOf: (name: string) => `Remove one ${name}`,
		tileLog: (name: string) => `Log ${name}`,
		tileAddGoal: (name: string) => `Add goal: ${name}`,
		tileLoggedAgain: (name: string, n: number) =>
			`${name}, logged ${n} ${enPlural(n, "time", "times")}. Log again`,
		tileGoalMore: (name: string, n: number) =>
			`${name}, goal ${n} ${enPlural(n, "time", "times")} a day. Add one more`,
	},
	{
		yourDailyGoals: "Twoje cele dzienne",
		logTitleToday: "Co dziś udało się zrobić?",
		logTitleThatDay: "Co udało się zrobić tego dnia?",
		logSubtitle: "Stuknij, żeby odhaczyć. Stuknij ponownie, jeśli więcej niż raz.",
		goalSubtitle: "Stuknij, żeby dodać cel. Stuknij ponownie, by robić to kilka razy dziennie.",
		searchPlaceholder: (n) => `Szukaj wśród ${n} ${plPlural(n, "habitu", "habitów", "habitów")}…`,
		searchAria: "Szukaj habitów",
		breakHint: "Zauważenie potknięcia to pierwszy krok do zmiany. Odhacz je bez wyrzutów 🌱",
		seeMatches: (n) =>
			`Pokaż ${n} ${plPlural(n, "wynik", "wyniki", "wyników")} we wszystkich kategoriach`,
		done: "Gotowe",
		allHabits: "Wszystkie habity",
		allShort: "Wszystko",
		habitsToBreak: "Habity do rzucenia",
		breakShort: "Rzucam",
		found: (n, where) => `Znaleziono: ${n}${where ? ` · ${where}` : ""}`,
		yourGoals: "Twoje cele",
		recentlyUsed: "Ostatnio używane",
		greatToStart: "Dobre na początek",
		noBreakMatch: (q) => `Żaden habit do rzucenia nie pasuje do „${q}”.`,
		noBreak: "Brak habitów do rzucenia — super! 🌿",
		noInCategory: (q, label) => `Brak „${q}” w kategorii ${label}.`,
		nothingCalled: (q) => `Nie ma jeszcze nic o nazwie „${q}”.`,
		nothingHere: "Jeszcze nic tu nie ma.",
		goalsADay: (n) => `${n} ${plPlural(n, "cel", "cele", "celów")} dziennie`,
		noGoals: "Jeszcze brak celów",
		nothingAdded: "Jeszcze nic nie dodano",
		added: (n) => `Dodano: ${n} — super! ✨`,

		category: "Kategoria",

		createNamed: (q) => `Utwórz „${q}”`,
		createOwn: "Utwórz własny habit",
		cutBack: "Coś jeszcze, co chcesz ograniczyć?",
		cantFind: "Nie ma na liście? Stwórz własny.",

		nameYourHabit: "Nazwij swój habit",
		namePlaceholder: "np. Gra na gitarze",
		pickIcon: "Wybierz ikonę",
		wantToBreak: "To habit, który chcę rzucić",
		createAndLog: "Utwórz i odhacz",
		createAndGoal: "Utwórz i dodaj cel",

		manage: "Zarządzaj",
		deleteHabit: (name) => `Usuń: ${name}`,
		removeOneOf: (name) => `Odejmij jeden: ${name}`,
		tileLog: (name) => `Odhacz: ${name}`,
		tileAddGoal: (name) => `Dodaj cel: ${name}`,
		tileLoggedAgain: (name, n) => `${name}, odhaczono ${n} ${plTimes(n)}. Odhacz ponownie`,
		tileGoalMore: (name, n) => `${name}, cel ${n} ${plTimes(n)} dziennie. Dodaj jeszcze raz`,
	},
);
