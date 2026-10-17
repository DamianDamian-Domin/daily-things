import { registerPlugin } from "@capacitor/core";
import { watch } from "vue";
import type { Goal, GoalRef, Habit, HabitLog } from "@/libs/types";
import type { DateKey } from "@/utils/date";
import { isDueOn } from "@/utils/goalSchedule";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import { paletteColors, pixelSprite } from "@/utils/pixelIcons";

// ==========================================================================
// Widżet „Dzisiejsze cele” na ekranie głównym Androida.
// Aplikacja przekazuje mu gotowy stan (cele, dzisiejsze wpisy, sprite'y ikon),
// a widżet sam odhacza: zapisuje wpis lokalnie i od razu wysyła go do
// Firestore. Czego nie zdążył wysłać (brak sieci), aplikacja dokańcza przy
// następnym otwarciu. Kod natywny: native/android/java/app/dailythings/widget.
// ==========================================================================

export interface WidgetColors {
	o: string;
	f: string;
	h: string;
	s: string;
}

export interface WidgetGoal {
	name: string;
	label: string;
	sprite: string;
	colors: WidgetColors;
	target: number;
	// Dzisiejsze wpisy tego habitu — cofnięcie na widżecie usuwa ostatni
	logs: HabitLog[];
	// Dodatkowe pola nowego wpisu (własne habity niosą ikonę i nazwę)
	extra: Omit<GoalRef, "id" | "name">;
}

export interface WidgetState {
	version: 1;
	date: DateKey;
	goals: WidgetGoal[];
	ghost: WidgetColors;
	// Migawka celów zapisywana razem z odhaczeniem (jak w logHabit)
	snapshot: GoalRef[];
}

export interface WidgetAuth {
	apiKey: string;
	projectId: string;
	uid: string;
	refreshToken: string;
}

export interface WidgetActionsResult {
	// Wysłane już przez widżet — wystarczy odświeżyć stan aplikacji
	synced: { op: "log" | "unlog"; date: DateKey; log: HabitLog }[];
	// Niewysłane — aplikacja zapisuje je sama
	pending: { op: "log" | "unlog"; date: DateKey; log: HabitLog }[];
}

interface HabitsWidgetPlugin {
	update(options: { state: string | null; auth: string | null }): Promise<void>;
	takeActions(): Promise<WidgetActionsResult>;
}

export const HabitsWidget = registerPlugin<HabitsWidgetPlugin>("HabitsWidget");

export function buildWidgetState(input: {
	date: DateKey;
	goals: Goal[];
	snapshot: GoalRef[];
	logs: HabitLog[];
	resolve: (goal: GoalRef) => Habit;
}): WidgetState {
	const extras = new Map(input.snapshot.map(({ id: _id, name, ...extra }) => [name, extra]));
	const byName = new Map<string, WidgetGoal>();
	for (const goal of input.goals) {
		const existing = byName.get(goal.name);
		if (existing) {
			existing.target++;
			continue;
		}
		const habit = input.resolve(goal);
		byName.set(goal.name, {
			name: goal.name,
			label: displayName(habit),
			sprite: pixelSprite(habit.icon),
			colors: paletteColors(paletteFor(habit)),
			target: 1,
			logs: input.logs.filter((l) => l.name === goal.name).map((l) => ({ ...l })),
			extra: extras.get(goal.name) ?? {},
		});
	}
	return {
		version: 1,
		date: input.date,
		goals: [...byName.values()],
		ghost: paletteColors("ghost"),
		snapshot: input.snapshot.map((g) => ({ ...g })),
	};
}

// --------------------------------------------------------------------------
// Połączenie ze store'ami (tylko na Androidzie, wywołuje App.vue)
// --------------------------------------------------------------------------
export async function startHabitsWidget() {
	const [{ useAuthStore }, { useHabitsStore }, { useProfileStore }, { auth }] = await Promise.all([
		import("@/stores/auth"),
		import("@/stores/habits"),
		import("@/stores/profile"),
		import("@/firebase"),
	]);
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const profileStore = useProfileStore();

	// Stara wersja natywnej części (bez widżetu) — nie zaśmiecamy konsoli
	let available = true;
	const call = async <T>(fn: () => Promise<T>): Promise<T | null> => {
		if (!available) return null;
		try {
			return await fn();
		} catch (err) {
			if ((err as { code?: string })?.code === "UNIMPLEMENTED") available = false;
			else console.warn("Habits widget call failed", err);
			return null;
		}
	};

	// Zapis z widżetu idzie przez REST API Firestore na tokenie odświeżania
	// użytkownika. Z emulatorami widżet tylko kolejkuje (wyśle aplikacja).
	function currentAuth(): WidgetAuth | null {
		const user = auth.currentUser;
		const env = import.meta.env;
		if (!user || env.VITE_USE_EMULATORS === "true") return null;
		return {
			apiKey: env.VITE_FIREBASE_API_KEY,
			projectId: env.VITE_FIREBASE_PROJECT_ID,
			uid: user.uid,
			refreshToken: user.refreshToken,
		};
	}

	function currentState(): WidgetState {
		const date = habitsStore.todayKey;
		return buildWidgetState({
			date,
			// Tylko cele na dziś (bez tygodniowych i zaplanowanych na inne dni)
			goals: habitsStore.dailyGoalsList.filter((g) => isDueOn(g, date)),
			snapshot: habitsStore.todayGoalsSnapshot(),
			logs: habitsStore.logsOn(date),
			resolve: habitsStore.resolve,
		});
	}

	let pushTimer: ReturnType<typeof setTimeout> | null = null;
	function pushSoon() {
		if (pushTimer) clearTimeout(pushTimer);
		pushTimer = setTimeout(push, 400);
	}
	function push() {
		pushTimer = null;
		// Bez zalogowanego użytkownika widżet zaprasza do aplikacji
		if (!authStore.userUid) return call(() => HabitsWidget.update({ state: null, auth: null }));
		if (!profileStore.ready) return; // historia jeszcze się wczytuje
		const userAuth = currentAuth();
		return call(() =>
			HabitsWidget.update({
				state: JSON.stringify(currentState()),
				auth: userAuth ? JSON.stringify(userAuth) : null,
			}),
		);
	}

	// Odhaczenia z widżetu → stan aplikacji (i Firestore, jeśli widżet nie zdążył)
	let draining = false;
	async function drain() {
		if (draining || !profileStore.ready || !authStore.userUid) return;
		draining = true;
		try {
			const result = await call(() => HabitsWidget.takeActions());
			if (!result) return;
			for (const action of result.synced ?? []) habitsStore.applyWidgetAction(action, false);
			for (const action of result.pending ?? []) habitsStore.applyWidgetAction(action, true);
		} finally {
			draining = false;
		}
		pushSoon();
	}

	watch(
		() =>
			profileStore.ready
				? JSON.stringify([authStore.userUid, currentState()])
				: JSON.stringify([authStore.userUid]),
		pushSoon,
		{ immediate: true },
	);
	watch(
		() => profileStore.ready,
		(ready) => {
			if (ready) drain();
		},
		{ immediate: true },
	);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") drain();
	});
}
