export type HabitSeverity = "success" | "danger";

// Pozycja katalogu habitów (src/assets/habitList.json) lub własny habit użytkownika
export interface Habit {
	name: string; // stabilny klucz zapisywany w Firestore — nie zmieniać
	icon: string;
	severity: HabitSeverity | string;
	tags: string[];
	origin: string; // "system" | "user"
	display_name: string;
	category?: string;
	id?: string;
	retired?: boolean; // wycofany z katalogu: nie do dodania, ale historia nadal go rozpoznaje
}

// Pojedyncze odhaczenie habitu w danym dniu (users/{uid}/habits/{YYYY-MM-DD}.habits[])
// Nowe wpisy zapisujemy „odchudzone” (id, name, at); stare wpisy mają pełną kopię Habit.
export interface HabitLog {
	id: string;
	name: string;
	at?: number; // znacznik czasu odhaczenia (ms)
	icon?: string;
	display_name?: string;
	severity?: string;
	category?: string;
	tags?: string[];
	origin?: string;
}

export interface GoalRef {
	id?: string;
	name: string;
	icon?: string;
	display_name?: string;
	severity?: string;
	origin?: string;
	tags?: string[];
}

export interface DayEntry {
	date: string;
	habits: HabitLog[];
	goalsSnapshot?: GoalRef[];
	// Nastrój dnia 1–5 (utils/mood.ts); brak = nie zapisano
	mood?: Mood;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

// Cel dzienny. Cel „3× dziennie” to 3 wpisy o tej samej nazwie (zgodność wstecz).
export interface Goal extends GoalRef {
	id: string;
}

// Widok zgrupowany (jedna kafelka na nazwę habitu)
// Przypomnienie o celu: godzina lokalna „HH:MM”, klucz to `name` habitu
export interface HabitReminder {
	name: string;
	time: string;
}

export interface GroupedHabit {
	name: string;
	habit: Habit;
	count: number;
}

export interface GroupedGoal {
	name: string;
	habit: Habit;
	target: number;
	done: number;
}

export type TodoColor =
	| ""
	| "red"
	| "orange"
	| "yellow"
	| "green"
	| "blue"
	| "purple";

export interface Subtask {
	id: string;
	text: string;
	done: boolean;
}

export interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
	description?: string;
	createdAt?: number;
	completedAt?: number;
	order?: number;
	color?: TodoColor;
	subtasks?: Subtask[];
}

type CarouselCardId = "manage" | "textAdd" | "stats" | "friends";

export interface CarouselCardConfig {
	id: CarouselCardId;
	order: number;
}

export interface UserPreferences {
	isDarkMode: boolean;
	soundEnabled: boolean;
	animationsEnabled: boolean;
	// Znajomi: udostępnianie postępów i nazw habitów (domyślnie włączone)
	shareProgress: boolean;
	shareHabits: boolean;
}

export type CookieConsentChoice =
	| "accepted_all"
	| "necessary_only"
	| "custom";

export interface CookieConsentPreferences {
	necessary: true;
	analytics: boolean;
}

export interface CookieConsentState {
	choice: CookieConsentChoice;
	preferences: CookieConsentPreferences;
	decidedAt: string;
	version: number;
}
