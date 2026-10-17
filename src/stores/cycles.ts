import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Habit, HabitCycle } from "@/libs/types";
import { saveUserFields, type UserDoc } from "@/services/userData";
import { useAuthStore } from "@/stores/auth";
import { useHabitsStore } from "@/stores/habits";
import { useToastStore } from "@/stores/toast";
import { cycleStatus, isValidCycle, MAX_EVERY, type CycleStatus, type CycleUnit } from "@/utils/cycles";
import { fromDateKey } from "@/utils/date";

const SAVE_ERROR = "Couldn't save that — check your connection and try again.";

export interface CycleItem {
	cycle: HabitCycle;
	habit: Habit;
	status: CycleStatus;
}

// Obowiązki cykliczne („lodówka co 4 tygodnie”). Termin liczymy z historii
// habitu, więc odhaczenie gdziekolwiek w aplikacji przesuwa go dalej.
export const useCyclesStore = defineStore("cycles", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const toast = useToastStore();

	const cycles = ref<HabitCycle[]>([]);
	// Historia od najstarszego punktu odniesienia jest już wczytana
	const ready = ref(false);

	const byName = computed(() => new Map(cycles.value.map((c) => [c.name, c])));

	function cycleFor(name: string): HabitCycle | null {
		return byName.value.get(name) ?? null;
	}

	// Najnowszy dzień z wpisem dla każdego habitu z cyklem (bez dni „na przyszłość”)
	const lastLogged = computed(() => {
		const today = habitsStore.todayKey;
		const names = byName.value;
		const last = new Map<string, string>();
		for (const day of Object.values(habitsStore.days)) {
			if (day.date > today) continue;
			for (const log of day.habits) {
				if (!names.has(log.name)) continue;
				const prev = last.get(log.name);
				if (!prev || day.date > prev) last.set(log.name, day.date);
			}
		}
		return last;
	});

	// Dla habitu, który jeszcze nie ma cyklu (nie ma go w `lastLogged`)
	function lastLoggedOf(name: string): string | null {
		const today = habitsStore.todayKey;
		let last: string | null = null;
		for (const day of Object.values(habitsStore.days)) {
			if (day.date > today || (last && day.date <= last)) continue;
			if (day.habits.some((l) => l.name === name)) last = day.date;
		}
		return last;
	}

	function statusFor(name: string): CycleStatus | null {
		const cycle = cycleFor(name);
		if (!cycle) return null;
		return cycleStatus(cycle, lastLogged.value.get(name) ?? null, habitsStore.todayKey);
	}

	// Wszystkie obowiązki, najpilniejsze najpierw
	const items = computed<CycleItem[]>(() =>
		cycles.value
			.map((cycle) => ({
				cycle,
				habit: habitsStore.resolve(cycle),
				status: cycleStatus(cycle, lastLogged.value.get(cycle.name) ?? null, habitsStore.todayKey),
			}))
			.sort((a, b) => a.status.daysLeft - b.status.daysLeft || a.cycle.name.localeCompare(b.cycle.name)),
	);

	// Na dziś lub po terminie — to pokazuje baner i to przypominają powiadomienia
	const dueItems = computed(() => (ready.value ? items.value.filter((i) => i.status.daysLeft <= 0) : []));

	function hydrate(userDoc: UserDoc) {
		cycles.value = Array.isArray(userDoc.cycles) ? userDoc.cycles.filter(isValidCycle) : [];
		ready.value = false;
	}

	async function persist(previous: HabitCycle[]) {
		const currentUid = authStore.userUid;
		if (!currentUid) return;
		try {
			await saveUserFields(currentUid, { cycles: cycles.value.map((c) => ({ ...c })) });
		} catch (err) {
			console.error("Saving cycles failed", err);
			if (authStore.userUid === currentUid) cycles.value = previous;
			toast.error(SAVE_ERROR);
		}
	}

	// Po wczytaniu sesji: doładowujemy historię od najstarszego punktu odniesienia
	// (zwykle kilka tygodni), a gdy w historii jest nowszy wpis, przesuwamy punkt
	// odniesienia — następnym razem trzeba czytać mniej.
	async function load() {
		const currentUid = authStore.userUid;
		if (!currentUid || !cycles.value.length) {
			ready.value = true;
			return;
		}
		const oldest = cycles.value.reduce((min, c) => (c.anchor < min ? c.anchor : min), habitsStore.todayKey);
		await habitsStore.ensureRange(fromDateKey(oldest), fromDateKey(habitsStore.todayKey));
		if (authStore.userUid !== currentUid) return;
		ready.value = true;

		const today = habitsStore.todayKey;
		let moved = false;
		const next = cycles.value.map((c) => {
			const last = lastLogged.value.get(c.name);
			// Dzisiejszy wpis można jeszcze cofnąć — przesuwamy tylko do wczoraj
			if (last && last > c.anchor && last < today) {
				moved = true;
				return { ...c, anchor: last };
			}
			return c;
		});
		if (moved) {
			const previous = cycles.value;
			cycles.value = next;
			await persist(previous);
		}
	}

	// every = null wyłącza cykl
	async function setCycle(name: string, every: number | null, unit: CycleUnit = "week") {
		if (!authStore.userUid) return;
		if (every !== null && (!Number.isInteger(every) || every < 1 || every > MAX_EVERY[unit])) return;
		const previous = cycles.value;
		const rest = previous.filter((c) => c.name !== name);
		if (every === null) {
			cycles.value = rest;
		} else {
			const existing = byName.value.get(name);
			// Liczymy od ostatniego razu — przy pierwszym ustawieniu potrzebna jest cała historia
			if (!existing && !habitsStore.allHistoryLoaded) await habitsStore.ensureAllHistory();
			const anchor = existing?.anchor ?? lastLoggedOf(name) ?? habitsStore.todayKey;
			cycles.value = [...rest, { name, every, unit, anchor }];
		}
		await persist(previous);
	}

	async function restore(cycle: HabitCycle) {
		const previous = cycles.value;
		cycles.value = [...previous.filter((c) => c.name !== cycle.name), cycle];
		await persist(previous);
	}

	function clear() {
		cycles.value = [];
		ready.value = false;
	}

	return { cycles, ready, items, dueItems, cycleFor, statusFor, hydrate, load, setCycle, restore, clear };
});
