import { defineMessages } from "@/i18n";

// Ekran główny: karuzela kart i karta Znajomi
export const homeMessages = defineMessages(
	{
		srTitle: "Daily Things — habits and to-dos",
		cards: "Cards",
		show: (card: string) => `Show ${card}`,
		cardLabels: {
			textAdd: "To-do list",
			manage: "Today's habits",
			stats: "Progress",
			friends: "Friends",
		},
		friendsError: "We couldn't reach your friends right now 🌧️ Try again in a moment.",
		friendsLoading: "Gathering your friends…",
		addFriend: "Add a friend",
	},
	{
		srTitle: "Daily Things — habity i zadania",
		cards: "Karty",
		show: (card) => `Pokaż: ${card}`,
		cardLabels: {
			textAdd: "Lista zadań",
			manage: "Dzisiejsze habity",
			stats: "Postępy",
			friends: "Znajomi",
		},
		friendsError: "Nie możemy teraz połączyć się ze znajomymi 🌧️ Spróbuj za chwilę.",
		friendsLoading: "Zbieramy twoich znajomych…",
		addFriend: "Dodaj znajomego",
	},
);
