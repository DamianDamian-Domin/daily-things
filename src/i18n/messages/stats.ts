import { defineMessages, enPlural, plPlural } from "@/i18n";

// Karta statystyk i jej sekcje
export const statsMessages = defineMessages(
	{
		title: "Your progress",
		period: "Period",
		week: "Week",
		month: "Month",
		prev: (period: "week" | "month") => `Previous ${period}`,
		next: (period: "week" | "month") => `Next ${period}`,
		empty: "Nothing here yet. Every logged habit grows this garden of stats 🌱",

		// Zakres dat
		thisWeek: (range: string) => `This week · ${range}`,
		lastWeek: (range: string) => `Last week · ${range}`,
		weekN: (n: number, range: string) => `Week ${n} · ${range}`,

		// KPI
		currentStreak: "Current streak",
		days: (n: number) => enPlural(n, "day", "days"),
		freezeTooltip: "One missed day a week won't break your streak",
		freezeLabel: "A free pass saved your streak this week",
		perfectDays: "Perfect days",
		habitsLogged: "Habits logged",

		// Przyciski „więcej”
		moreInsights: "More insights",
		recap: "Recap",
		badges: "Badges",
		year: "Year",
		lastDone: "Last done",

		// Dni
		daysLabel: "Days",
		dayAria: (name: string, date: string, total: number, perfect: boolean) =>
			`${name} ${date}: ${total} logged${perfect ? ", all goals done" : ""}. Open day`,

		// Mapa ciepła
		monthOverview: "Month overview",
		weekdayInitials: ["M", "T", "W", "T", "F", "S", "S"],
		heatAria: (date: string, total: number, perfect: boolean) =>
			`${date}: ${total} logged${perfect ? ", all goals done" : ""}`,
		heatTooltip: (date: string, total: number) => `${date} · ${total} logged`,
		less: "Less",
		more: "More",
		allGoalsLegend: "🏅 = all goals",

		// Sekcje
		mostLogged: "Most logged",
		energy: "Where your energy went",
	},
	{
		title: "Twoje postępy",
		period: "Okres",
		week: "Tydzień",
		month: "Miesiąc",
		prev: (period) => (period === "week" ? "Poprzedni tydzień" : "Poprzedni miesiąc"),
		next: (period) => (period === "week" ? "Następny tydzień" : "Następny miesiąc"),
		empty: "Jeszcze pusto. Każdy zapisany habit podlewa ten ogródek statystyk 🌱",

		thisWeek: (range) => `Ten tydzień · ${range}`,
		lastWeek: (range) => `Poprzedni tydzień · ${range}`,
		weekN: (n, range) => `Tydzień ${n} · ${range}`,

		currentStreak: "Obecna seria",
		days: (n) => plPlural(n, "dzień", "dni", "dni"),
		freezeTooltip: "Jeden opuszczony dzień w tygodniu nie przerwie serii",
		freezeLabel: "W tym tygodniu darmowa przepustka uratowała twoją serię",
		perfectDays: "Idealne dni",
		habitsLogged: "Zapisane habity",

		moreInsights: "Więcej podsumowań",
		recap: "Podsumowanie",
		badges: "Odznaki",
		year: "Rok",
		lastDone: "Ostatnio",

		daysLabel: "Dni",
		dayAria: (name, date, total, perfect) =>
			`${name} ${date}: zapisano ${total}${perfect ? ", wszystkie cele zrobione" : ""}. Otwórz dzień`,

		monthOverview: "Przegląd miesiąca",
		weekdayInitials: ["P", "W", "Ś", "C", "P", "S", "N"],
		heatAria: (date, total, perfect) =>
			`${date}: zapisano ${total}${perfect ? ", wszystkie cele zrobione" : ""}`,
		heatTooltip: (date, total) => `${date} · zapisano ${total}`,
		less: "Mniej",
		more: "Więcej",
		allGoalsLegend: "🏅 = wszystkie cele",

		mostLogged: "Najczęściej",
		energy: "Na co poszła twoja energia",
	},
);
