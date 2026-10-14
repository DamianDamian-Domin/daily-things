import { defineMessages } from "@/i18n";

// Szkielet aplikacji: nawigacja, dymki (toasty), link „przejdź do treści”
export const shellMessages = defineMessages(
	{
		skipToContent: "Skip to content",
		mainNav: "Main",
		home: "Daily Things — home",
		saveProgress: "Save your progress",
		toLightMode: "Switch to light mode",
		toDarkMode: "Switch to dark mode",
		settings: "Settings",
		account: (name: string) => `Account: ${name}`,
		guestLower: "guest",
		tabs: {
			textAdd: "To-do",
			manage: "Today",
			stats: "Progress",
			friends: "Friends",
			me: "Me",
		},
		progressNotSaved: "(progress not saved yet)",
		sessionLoadFailed: "We couldn't load your data. Check your connection.",
		// Dymki
		dismiss: "Dismiss",
		genericError: "Something went wrong. Please try again.",
		undo: "Undo",
	},
	{
		skipToContent: "Przejdź do treści",
		mainNav: "Główna",
		home: "Daily Things — strona główna",
		saveProgress: "Zapisz postępy",
		toLightMode: "Włącz tryb jasny",
		toDarkMode: "Włącz tryb ciemny",
		settings: "Ustawienia",
		account: (name) => `Konto: ${name}`,
		guestLower: "gość",
		tabs: {
			textAdd: "Zadania",
			manage: "Dziś",
			stats: "Postępy",
			friends: "Znajomi",
			me: "Ja",
		},
		progressNotSaved: "(postępy jeszcze niezapisane)",
		sessionLoadFailed: "Nie udało się wczytać danych. Sprawdź połączenie.",
		dismiss: "Zamknij",
		genericError: "Coś poszło nie tak. Spróbuj ponownie.",
		undo: "Cofnij",
	},
);
