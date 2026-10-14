import { watch } from "vue";
import type { App } from "vue";
import { dateLocale, locale, type Locale } from "@/i18n";

// Kalendarz PrimeVue ma własne nazwy miesięcy i dni — budujemy je z Intl,
// żeby szły za językiem aplikacji (tydzień zawsze od poniedziałku).
function calendarLocale(l: Locale) {
	const tag = dateLocale(l);
	const day = (style: "long" | "short" | "narrow") =>
		// 4 stycznia 2026 to niedziela — PrimeVue oczekuje tablicy od niedzieli
		Array.from({ length: 7 }, (_, i) =>
			new Date(2026, 0, 4 + i).toLocaleDateString(tag, { weekday: style }),
		);
	const month = (style: "long" | "short") =>
		Array.from({ length: 12 }, (_, i) =>
			new Date(2026, i, 1).toLocaleDateString(tag, { month: style }),
		);
	const pl = l === "pl";
	return {
		dayNames: day("long"),
		dayNamesShort: day("short"),
		dayNamesMin: pl ? ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
		monthNames: month("long").map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
		monthNamesShort: month("short"),
		firstDayOfWeek: 1,
		today: pl ? "Dziś" : "Today",
		clear: pl ? "Wyczyść" : "Clear",
		chooseDate: pl ? "Wybierz datę" : "Choose Date",
		prevMonth: pl ? "Poprzedni miesiąc" : "Previous Month",
		nextMonth: pl ? "Następny miesiąc" : "Next Month",
		prevYear: pl ? "Poprzedni rok" : "Previous Year",
		nextYear: pl ? "Następny rok" : "Next Year",
		chooseMonth: pl ? "Wybierz miesiąc" : "Choose Month",
		chooseYear: pl ? "Wybierz rok" : "Choose Year",
		emptyMessage: pl ? "Brak wyników" : "No results found",
		emptyFilterMessage: pl ? "Brak wyników" : "No results found",
	};
}

export function syncPrimeVueLocale(app: App) {
	const apply = (l: Locale) => {
		const config = app.config.globalProperties.$primevue?.config;
		if (config?.locale) Object.assign(config.locale, calendarLocale(l));
	};
	apply(locale.value);
	watch(locale, apply);
}
