import { defineMessages } from "@/i18n";

// Przypomnienia o celach: okno ustawień i powiadomienia na Androidzie
export const remindersMessages = defineMessages(
	{
		title: "Reminders",
		subtitle: "A gentle nudge at your time. Skipped once the goal is done.",
		timesADay: (n: number) => `${n}× a day`,
		timeFor: (label: string) => `Reminder time for ${label}`,
		turnOffFor: (label: string) => `Turn off reminder for ${label}`,
		turnOff: "Turn off",
		addFor: (label: string) => `Add a reminder for ${label}`,
		addTime: "Add time",
		empty: "Reminders are for daily goals. Pick a goal first and come back here.",
		done: "Done",
		noteUnsupported:
			"Reminders ring on your phone in the Daily Things Android app. Times you set here sync there.",
		noteDenied:
			"Notifications are off for Daily Things. Turn them on in your phone's settings to get nudges.",
		fallbackGoal: "goal",
		turnedOff: (label: string) => `Reminder for ${label} turned off`,
		saveError: "Couldn't save that reminder — check your connection and try again.",
		permissionDenied: "Notifications are off for Daily Things. Turn them on in your phone's settings.",
		notificationBodyTarget: (n: number) =>
			`Time for it! Your goal is ${n}× today. Small steps count 🌱`,
		notificationBody: "Time for it! Small steps count 🌱",
		channelName: "Habit reminders",
		channelDescription: "Nudges at the times you set for your daily goals",
	},
	{
		title: "Przypomnienia",
		subtitle: "Delikatne szturchnięcie o twojej porze. Pomijane, gdy cel jest już zrobiony.",
		timesADay: (n) => `${n}× dziennie`,
		timeFor: (label) => `Godzina przypomnienia: ${label}`,
		turnOffFor: (label) => `Wyłącz przypomnienie: ${label}`,
		turnOff: "Wyłącz",
		addFor: (label) => `Dodaj przypomnienie: ${label}`,
		addTime: "Dodaj godzinę",
		empty: "Przypomnienia działają dla celów dziennych. Najpierw wybierz cel i wróć tutaj.",
		done: "Gotowe",
		noteUnsupported:
			"Przypomnienia dzwonią na telefonie w aplikacji Daily Things na Androida. Godziny ustawione tutaj synchronizują się tam.",
		noteDenied:
			"Powiadomienia Daily Things są wyłączone. Włącz je w ustawieniach telefonu, żeby dostawać przypomnienia.",
		fallbackGoal: "cel",
		turnedOff: (label) => `Wyłączono przypomnienie: ${label}`,
		saveError: "Nie udało się zapisać przypomnienia — sprawdź połączenie i spróbuj ponownie.",
		permissionDenied: "Powiadomienia Daily Things są wyłączone. Włącz je w ustawieniach telefonu.",
		notificationBodyTarget: (n) => `Pora na to! Twój cel na dziś to ${n}×. Małe kroki się liczą 🌱`,
		notificationBody: "Pora na to! Małe kroki się liczą 🌱",
		channelName: "Przypomnienia o habitach",
		channelDescription: "Przypomnienia o godzinach ustawionych dla celów dziennych",
	},
);
