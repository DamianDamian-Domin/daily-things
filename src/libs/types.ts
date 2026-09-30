export type HabbitSeverity = "success" | "danger";

// Pozycja katalogu habitów (src/assets/habbitList.json) lub własny habit użytkownika
export interface Habbit {
	name: string; // stabilny klucz zapisywany w Firestore — nie zmieniać
	icon: string;
	severity: HabbitSeverity | string;
	tags: string[];
	origin: string; // "system" | "user"
	display_name: string;
	category?: string;
	id?: string;
}

// Pojedyncze odhaczenie habitu w danym dniu (users/{uid}/habbits/{YYYY-MM-DD}.habbits[])
// Nowe wpisy zapisujemy „odchudzone” (id, name, at); stare wpisy mają pełną kopię Habbit.
export interface HabbitLog {
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
	habbits: HabbitLog[];
	goalsSnapshot?: GoalRef[];
}

// Cel dzienny. Cel „3× dziennie” to 3 wpisy o tej samej nazwie (zgodność wstecz).
export interface Goal extends GoalRef {
	id: string;
}

// Widok zgrupowany (jedna kafelka na nazwę habitu)
export interface GroupedHabbit {
	name: string;
	habbit: Habbit;
	count: number;
}

export interface GroupedGoal {
	name: string;
	habbit: Habbit;
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

type CarouselCardId = "manage" | "textAdd" | "stats";

export interface CarouselCardConfig {
	id: CarouselCardId;
	order: number;
}

export interface UserPreferences {
	isDarkMode: boolean;
	soundEnabled: boolean;
	animationsEnabled: boolean;
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
