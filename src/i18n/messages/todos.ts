import { defineMessages, enPlural, plPlural } from "@/i18n";

// Lista zadań: karta, wiersz zadania, okno szczegółów, sklep (toasty)
export const todosMessages = defineMessages(
	{
		title: "To-do list",
		ringLabel: (done: number, total: number) => `${done} of ${total} tasks done`,
		emptyList: "Your list is clear. Add something small you'd like to get done.",
		allClear: "🎉 All clear! Nothing left on your list.",
		sublineEmpty: "One small thing at a time.",
		sublineAllDone: "Everything's ticked off. Lovely.",
		sublineLeft: (n: number) => `${n} ${enPlural(n, "thing", "things")} left`,
		doneToast: (cheer: string) => `Done — ${cheer}`,
		allStepsDone: "All steps done! Complete the task?",
		complete: "Complete",
		saveError: "Couldn't save your to-do — check your connection.",

		// Dodawanie
		newTask: "New task",
		addPlaceholder: "Add a task…",
		add: "Add",

		// Ukończone
		completedCount: (n: number) => `${n} completed`,
		clear: "Clear",
		cleared: (n: number) => `Cleared ${n} completed`,

		// Wiersz zadania
		open: (text: string) => `Open “${text}”`,
		hasNotes: "has notes",
		stepsChip: (done: number, total: number, expanded: boolean) =>
			`${done} of ${total} steps done. ${expanded ? "Hide" : "Show"} steps`,
		addStepTo: (text: string) => `Add a step to “${text}”`,
		addStepPlaceholder: "+ Add a step",

		// Okno szczegółów
		detailsTitle: "Task details",
		task: "Task",
		steps: "Steps",
		editStep: (text: string) => `Edit step “${text}”`,
		deleteStep: (text: string) => `Delete step “${text}”`,
		newStepPlaceholder: "Add a step and press Enter",
		newStep: "New step",
		notes: "Notes",
		notesPlaceholder: "Anything worth remembering…",
		color: "Color",
		colors: {
			none: "No color",
			red: "Red",
			orange: "Orange",
			yellow: "Yellow",
			green: "Green",
			blue: "Blue",
			purple: "Purple",
		},
		done: "Done",
		deleted: (text: string) => `Deleted “${text}”`,
	},
	{
		title: "Lista zadań",
		ringLabel: (done, total) => `Zrobione: ${done} z ${total}`,
		emptyList: "Lista jest pusta. Dodaj coś małego, co chcesz dziś zrobić.",
		allClear: "🎉 Gotowe! Na liście nic już nie zostało.",
		sublineEmpty: "Jedna mała rzecz naraz.",
		sublineAllDone: "Wszystko odhaczone. Pięknie.",
		sublineLeft: (n) =>
			`${plPlural(n, "Została", "Zostały", "Zostało")} ${n} ${plPlural(n, "rzecz", "rzeczy", "rzeczy")}`,
		doneToast: (cheer) => `Zrobione — ${cheer}`,
		allStepsDone: "Wszystkie kroki zrobione! Zamknąć zadanie?",
		complete: "Zamknij",
		saveError: "Nie udało się zapisać zadania — sprawdź połączenie.",

		newTask: "Nowe zadanie",
		addPlaceholder: "Dodaj zadanie…",
		add: "Dodaj",

		completedCount: (n) => `Ukończone: ${n}`,
		clear: "Wyczyść",
		cleared: (n) => `Usunięto ukończone: ${n}`,

		open: (text) => `Otwórz „${text}”`,
		hasNotes: "ma notatki",
		stepsChip: (done, total, expanded) =>
			`Zrobione kroki: ${done} z ${total}. ${expanded ? "Ukryj" : "Pokaż"} kroki`,
		addStepTo: (text) => `Dodaj krok do „${text}”`,
		addStepPlaceholder: "+ Dodaj krok",

		detailsTitle: "Szczegóły zadania",
		task: "Zadanie",
		steps: "Kroki",
		editStep: (text) => `Edytuj krok „${text}”`,
		deleteStep: (text) => `Usuń krok „${text}”`,
		newStepPlaceholder: "Dodaj krok i naciśnij Enter",
		newStep: "Nowy krok",
		notes: "Notatki",
		notesPlaceholder: "Coś, o czym warto pamiętać…",
		color: "Kolor",
		colors: {
			none: "Bez koloru",
			red: "Czerwony",
			orange: "Pomarańczowy",
			yellow: "Żółty",
			green: "Zielony",
			blue: "Niebieski",
			purple: "Fioletowy",
		},
		done: "Gotowe",
		deleted: (text) => `Usunięto „${text}”`,
	},
);
