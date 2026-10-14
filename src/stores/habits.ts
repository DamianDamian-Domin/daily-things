import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { arrayRemove, arrayUnion, setDoc, updateDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import type {
	DayEntry,
	Goal,
	GoalRef,
	GroupedGoal,
	GroupedHabit,
	Habit,
	HabitLog,
} from "@/libs/types";
import { useAuthStore } from "@/stores/auth";
import { plain } from "@/utils/plain";
import { useToastStore } from "@/stores/toast";
import {
	DAY_LOGS_FIELD,
	dayDocRef,
	fetchDays,
	saveUserFields,
	type UserDoc,
} from "@/services/userData";
import {
	addDays,
	monthBounds,
	monthKeyOf,
	monthsInRange,
	startOfDay,
	toDateKey,
	todayKey as computeTodayKey,
	type DateKey,
} from "@/utils/date";
import { CATALOG, findCatalogHabit, resolveHabit } from "@/utils/habitCatalog";

const RECENT_LIMIT = 12;
const MAX_STREAK_LOOKBACK_MONTHS = 24;
const SAVE_ERROR = "Couldn't save that — check your connection and try again.";

export const useHabitsStore = defineStore("habits", () => {
	const authStore = useAuthStore();
	const toast = useToastStore();
	const uid = computed(() => authStore.userUid);

	// ==========================================================================
	// STAN
	// ==========================================================================
	const todayKey = ref<DateKey>(computeTodayKey());
	const selectedDate = ref<Date>(startOfDay());
	const days = ref<Record<DateKey, DayEntry>>({});
	const dailyGoalsList = ref<Goal[]>([]);
	const recentHabits = ref<string[]>([]);
	const customHabits = ref<Habit[]>([]);
	const isHistoryLoading = ref(false);

	// Cache doładowanych miesięcy — każdy miesiąc czytamy z Firestore raz na sesję
	const loadedMonths = new Set<string>();
	const pendingMonths = new Map<string, Promise<void>>();
	// Dni z niezakończonym zapisem — nie nadpisujemy ich danymi z serwera
	const pendingDays = new Map<DateKey, number>();

	// Zmiana dnia o północy (aplikacja często zostaje otwarta w tle)
	function checkDayRollover() {
		const now = computeTodayKey();
		if (now === todayKey.value) return;
		const wasOnToday = toDateKey(selectedDate.value) === todayKey.value;
		todayKey.value = now;
		if (wasOnToday) selectedDate.value = startOfDay();
		ensureMonthFor(new Date());
	}
	if (typeof window !== "undefined") {
		setInterval(checkDayRollover, 60_000);
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") checkDayRollover();
		});
	}

	// ==========================================================================
	// KATALOG
	// ==========================================================================
	const allHabitsList = computed<Habit[]>(() => [...customHabits.value, ...CATALOG]);

	function resolve(entry: HabitLog | GoalRef | Habit): Habit {
		return resolveHabit(entry, customHabits.value);
	}

	// ==========================================================================
	// WYBRANY DZIEŃ
	// ==========================================================================
	const selectedKey = computed(() => toDateKey(selectedDate.value));
	const isSelectedToday = computed(() => selectedKey.value === todayKey.value);

	function logsOn(key: DateKey): HabitLog[] {
		return days.value[key]?.habits ?? [];
	}

	function countsOn(key: DateKey): Record<string, number> {
		const counts: Record<string, number> = {};
		for (const log of logsOn(key)) counts[log.name] = (counts[log.name] ?? 0) + 1;
		return counts;
	}

	function groupLogs(logs: HabitLog[]): GroupedHabit[] {
		const map = new Map<string, GroupedHabit>();
		for (const log of logs) {
			const group = map.get(log.name);
			if (group) group.count++;
			else map.set(log.name, { name: log.name, habit: resolve(log), count: 1 });
		}
		return [...map.values()];
	}

	const selectedLogs = computed(() => logsOn(selectedKey.value));
	const selectedCounts = computed(() => countsOn(selectedKey.value));
	const groupedSelectedDayHabits = computed(() => groupLogs(selectedLogs.value));

	// ==========================================================================
	// CELE
	// ==========================================================================
	// Dziś zawsze obowiązuje aktualna lista celów; przeszłe dni mają zapisaną
	// „migawkę” celów z tamtego dnia, żeby zmiana celów nie psuła historii.
	function goalsFor(key: DateKey): GoalRef[] {
		if (key === todayKey.value) return dailyGoalsList.value;
		return days.value[key]?.goalsSnapshot ?? dailyGoalsList.value;
	}

	// Cele, które faktycznie liczymy w statystykach (bez „dopisywania” dzisiejszych
	// celów do dni, w których nic nie zapisano)
	function recordedGoalsFor(key: DateKey): GoalRef[] {
		if (key === todayKey.value) return dailyGoalsList.value;
		return days.value[key]?.goalsSnapshot ?? [];
	}

	function groupGoals(goals: GoalRef[], counts: Record<string, number>): GroupedGoal[] {
		const map = new Map<string, GroupedGoal>();
		for (const goal of goals) {
			const group = map.get(goal.name);
			if (group) group.target++;
			else map.set(goal.name, { name: goal.name, habit: resolve(goal), target: 1, done: 0 });
		}
		for (const group of map.values()) group.done = Math.min(counts[group.name] ?? 0, group.target);
		return [...map.values()];
	}

	const groupedGoals = computed(() =>
		groupGoals(goalsFor(selectedKey.value), selectedCounts.value),
	);

	const goalsProgress = computed(() => {
		let done = 0;
		let total = 0;
		for (const g of groupedGoals.value) {
			done += g.done;
			total += g.target;
		}
		return { done, total, complete: total > 0 && done === total };
	});

	function dayGoalsProgress(key: DateKey) {
		const grouped = groupGoals(recordedGoalsFor(key), countsOn(key));
		let done = 0;
		let total = 0;
		for (const g of grouped) {
			done += g.done;
			total += g.target;
		}
		return { done, total, perfect: total > 0 && done === total };
	}

	// ==========================================================================
	// SERIA (STREAK)
	// ==========================================================================
	function hasLogsOn(key: DateKey) {
		return logsOn(key).length > 0;
	}

	// Liczba dni z rzędu z co najmniej jednym wpisem. Dzisiejszy dzień „nie psuje”
	// serii, dopóki trwa — liczymy od wczoraj i dodajemy dziś, jeśli coś jest.
	const streak = computed(() => {
		let count = hasLogsOn(todayKey.value) ? 1 : 0;
		let day = addDays(startOfDay(), -1);
		while (hasLogsOn(toDateKey(day))) {
			count++;
			day = addDays(day, -1);
		}
		return count;
	});

	// Seria trwa, ale dziś jeszcze nic nie zapisano — delikatne przypomnienie
	const streakAtRisk = computed(() => streak.value > 0 && !hasLogsOn(todayKey.value));

	// Czy seria dochodzi do najstarszego wczytanego miesiąca (trzeba doładować)
	function streakTouchesLoadedEdge(): boolean {
		const oldest = [...loadedMonths].sort()[0];
		if (!oldest) return false;
		const [y, m] = oldest.split("-").map(Number);
		const firstLoaded = new Date(y, m - 1, 1);
		const streakStart = addDays(startOfDay(), -(streak.value - (hasLogsOn(todayKey.value) ? 1 : 0)));
		return streak.value > 0 && streakStart <= addDays(firstLoaded, 0);
	}

	// ==========================================================================
	// WCZYTYWANIE HISTORII
	// ==========================================================================
	function mergeRemoteDay(remote: DayEntry) {
		const local = days.value[remote.date];
		if (local && pendingDays.get(remote.date)) {
			const known = new Set(local.habits.map((l) => l.id));
			local.habits.push(...remote.habits.filter((l) => !known.has(l.id)));
			local.goalsSnapshot ??= remote.goalsSnapshot;
			return;
		}
		days.value[remote.date] = remote;
	}

	function ensureMonth(year: number, monthIndex: number): Promise<void> {
		const currentUid = uid.value;
		if (!currentUid) return Promise.resolve();
		const key = monthKeyOf(new Date(year, monthIndex, 1));
		if (loadedMonths.has(key)) return Promise.resolve();
		const pending = pendingMonths.get(key);
		if (pending) return pending;

		const { startKey, endKey } = monthBounds(year, monthIndex);
		const promise = fetchDays(currentUid, startKey, endKey)
			.then((entries) => {
				if (uid.value !== currentUid) return; // użytkownik zdążył się przelogować
				for (const entry of entries) mergeRemoteDay(entry);
				loadedMonths.add(key);
			})
			.catch((err) => {
				console.error(`Failed to load ${key}`, err);
			})
			.finally(() => pendingMonths.delete(key));
		pendingMonths.set(key, promise);
		return promise;
	}

	function ensureMonthFor(date: Date) {
		return ensureMonth(date.getFullYear(), date.getMonth());
	}

	async function ensureRange(start: Date, end: Date) {
		await Promise.all(monthsInRange(start, end).map(([y, m]) => ensureMonth(y, m)));
	}

	// Start sesji: bieżący i poprzedni miesiąc, potem cofamy się tak długo,
	// jak trwa seria (wcześniej seria „urywała się” na granicy miesiąca).
	async function loadInitialHistory() {
		isHistoryLoading.value = true;
		try {
			const now = new Date();
			await Promise.all([
				ensureMonthFor(now),
				ensureMonthFor(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
			]);
			for (let i = 2; i < MAX_STREAK_LOOKBACK_MONTHS && streakTouchesLoadedEdge(); i++) {
				await ensureMonthFor(new Date(now.getFullYear(), now.getMonth() - i, 1));
			}
		} finally {
			isHistoryLoading.value = false;
		}
	}

	function hydrate(userDoc: UserDoc) {
		dailyGoalsList.value = Array.isArray(userDoc.dailyGoals) ? userDoc.dailyGoals : [];
		recentHabits.value = Array.isArray(userDoc.recentlyUsed) ? userDoc.recentlyUsed : [];
		customHabits.value = Array.isArray(userDoc.customHabbits) ? userDoc.customHabbits : [];
	}

	// ==========================================================================
	// ZAPIS WPISÓW
	// ==========================================================================
	function beginWrite(key: DateKey) {
		pendingDays.set(key, (pendingDays.get(key) ?? 0) + 1);
	}
	function endWrite(key: DateKey) {
		const left = (pendingDays.get(key) ?? 1) - 1;
		if (left <= 0) pendingDays.delete(key);
		else pendingDays.set(key, left);
	}

	function localDay(key: DateKey): DayEntry {
		if (!days.value[key]) days.value[key] = { date: key, habits: [] };
		return days.value[key];
	}

	// Nowe wpisy zapisujemy „odchudzone” — nazwa jest kluczem do katalogu.
	// Własne habity niosą ikonę i nazwę, żeby historia przetrwała ich usunięcie.
	function slim<T extends GoalRef>(habit: Habit | GoalRef, base: T): T {
		if (findCatalogHabit(habit.name)) return base;
		const resolved = resolve(habit);
		return {
			...base,
			icon: resolved.icon,
			display_name: resolved.display_name,
			severity: resolved.severity,
			origin: "user",
		};
	}

	function snapshotToWrite(key: DateKey): GoalRef[] | null {
		const slimGoals = () =>
			dailyGoalsList.value.map((g) => slim(g, { id: g.id, name: g.name }));
		if (key === todayKey.value) return slimGoals();
		if (days.value[key]?.goalsSnapshot) return null; // zostawiamy historyczną migawkę
		return slimGoals();
	}

	// Zapisy są optymistyczne: stan lokalny zmienia się od razu, a zapis do
	// Firestore leci w tle (offline trafia do kolejki). Przy błędzie cofamy zmianę.
	function logHabit(habit: Habit, key: DateKey = selectedKey.value): HabitLog | null {
		const currentUid = uid.value;
		if (!currentUid) {
			authStore.openAuthDialog("welcome");
			return null;
		}
		const log: HabitLog = slim(habit, { id: nanoid(), name: habit.name, at: Date.now() });
		const snapshot = snapshotToWrite(key);
		const entry = localDay(key);
		entry.habits.push(log);
		if (snapshot) entry.goalsSnapshot = snapshot;
		touchRecent(habit.name);

		beginWrite(key);
		setDoc(
			dayDocRef(currentUid, key),
			{
				date: key,
				[DAY_LOGS_FIELD]: arrayUnion(log),
				...(snapshot ? { goalsSnapshot: snapshot } : {}),
			},
			{ merge: true },
		)
			.catch((err) => {
				console.error("logHabit failed", err);
				const idx = entry.habits.findIndex((l) => l.id === log.id);
				if (idx !== -1) entry.habits.splice(idx, 1);
				toast.error(SAVE_ERROR);
			})
			.finally(() => endWrite(key));
		return log;
	}

	function removeLog(logId: string, key: DateKey = selectedKey.value): HabitLog | null {
		const currentUid = uid.value;
		const entry = days.value[key];
		if (!currentUid || !entry) return null;
		const idx = entry.habits.findIndex((l) => l.id === logId);
		if (idx === -1) return null;
		const removed = plain(entry.habits[idx]);
		entry.habits.splice(idx, 1);

		beginWrite(key);
		updateDoc(dayDocRef(currentUid, key), { [DAY_LOGS_FIELD]: arrayRemove(removed) })
			.catch((err) => {
				console.error("removeLog failed", err);
				entry.habits.splice(Math.min(idx, entry.habits.length), 0, removed);
				toast.error(SAVE_ERROR);
			})
			.finally(() => endWrite(key));
		return removed;
	}

	// Usuwa ostatnie odhaczenie danego habitu (np. „−1” przy myciu zębów 3×)
	function unlogHabit(name: string, key: DateKey = selectedKey.value): HabitLog | null {
		const logs = logsOn(key);
		for (let i = logs.length - 1; i >= 0; i--) {
			if (logs[i].name === name) return removeLog(logs[i].id, key);
		}
		return null;
	}

	function removeAllLogs(name: string, key: DateKey = selectedKey.value): HabitLog[] {
		const toRemove = logsOn(key).filter((l) => l.name === name);
		const removed: HabitLog[] = [];
		for (const log of [...toRemove].reverse()) {
			const r = removeLog(log.id, key);
			if (r) removed.push(r);
		}
		return removed;
	}

	// Cofnięcie usunięcia — przywracamy dokładnie ten sam wpis (to samo id)
	function restoreLogs(logs: HabitLog[], key: DateKey = selectedKey.value) {
		const currentUid = uid.value;
		if (!currentUid || logs.length === 0) return;
		const copies = logs.map((l) => plain(l));
		const entry = localDay(key);
		entry.habits.push(...copies);
		beginWrite(key);
		setDoc(
			dayDocRef(currentUid, key),
			{ date: key, [DAY_LOGS_FIELD]: arrayUnion(...copies) },
			{ merge: true },
		)
			.catch((err) => {
				console.error("restoreLogs failed", err);
				const ids = new Set(copies.map((l) => l.id));
				entry.habits = entry.habits.filter((l) => !ids.has(l.id));
				toast.error(SAVE_ERROR);
			})
			.finally(() => endWrite(key));
	}

	async function reorderSelected(names: string[]) {
		const currentUid = uid.value;
		const key = selectedKey.value;
		const entry = days.value[key];
		if (!currentUid || !entry) return;
		const byName = new Map<string, HabitLog[]>();
		for (const log of entry.habits) {
			if (!byName.has(log.name)) byName.set(log.name, []);
			byName.get(log.name)!.push(log);
		}
		entry.habits = names.flatMap((n) => byName.get(n) ?? []);
		beginWrite(key);
		try {
			await updateDoc(dayDocRef(currentUid, key), {
				[DAY_LOGS_FIELD]: entry.habits.map((l) => plain(l)),
			});
		} catch (err) {
			console.error("reorder failed", err);
			toast.error(SAVE_ERROR);
		} finally {
			endWrite(key);
		}
	}

	// ==========================================================================
	// OSTATNIO UŻYWANE (zapis z opóźnieniem — nie przy każdym kliknięciu)
	// ==========================================================================
	let recentTimer: ReturnType<typeof setTimeout> | null = null;
	function touchRecent(name: string) {
		recentHabits.value = [name, ...recentHabits.value.filter((n) => n !== name)].slice(
			0,
			RECENT_LIMIT,
		);
		if (recentTimer) clearTimeout(recentTimer);
		const currentUid = uid.value;
		recentTimer = setTimeout(() => {
			if (!currentUid || uid.value !== currentUid) return;
			saveUserFields(currentUid, { recentlyUsed: [...recentHabits.value] }).catch((err) =>
				console.warn("recentlyUsed save failed", err),
			);
		}, 1500);
	}

	// ==========================================================================
	// CELE — ZAPIS
	// ==========================================================================
	async function persistGoals(previous: Goal[]) {
		const currentUid = uid.value;
		if (!currentUid) return;
		try {
			await saveUserFields(currentUid, { dailyGoals: plain(dailyGoalsList.value) });
			// Dzisiejsza migawka nadąża za zmianami celów
			const today = days.value[todayKey.value];
			if (today) {
				const snapshot = snapshotToWrite(todayKey.value)!;
				today.goalsSnapshot = snapshot;
				await updateDoc(dayDocRef(currentUid, todayKey.value), { goalsSnapshot: snapshot });
			}
		} catch (err) {
			console.error("persistGoals failed", err);
			dailyGoalsList.value = previous;
			toast.error(SAVE_ERROR);
		}
	}

	async function addDailyGoal(habit: Habit | GoalRef) {
		const previous = [...dailyGoalsList.value];
		dailyGoalsList.value = [
			...dailyGoalsList.value,
			slim(habit, { id: nanoid(), name: habit.name }) as Goal,
		];
		await persistGoals(previous);
	}

	async function removeGoalInstance(name: string) {
		const idx = dailyGoalsList.value.map((g) => g.name).lastIndexOf(name);
		if (idx === -1) return;
		const previous = [...dailyGoalsList.value];
		dailyGoalsList.value = dailyGoalsList.value.filter((_, i) => i !== idx);
		await persistGoals(previous);
	}

	async function removeGoal(name: string) {
		const previous = [...dailyGoalsList.value];
		dailyGoalsList.value = dailyGoalsList.value.filter((g) => g.name !== name);
		await persistGoals(previous);
		return previous;
	}

	async function restoreGoals(list: Goal[]) {
		const previous = [...dailyGoalsList.value];
		dailyGoalsList.value = list;
		await persistGoals(previous);
	}

	async function setGoalTarget(name: string, target: number) {
		const current = dailyGoalsList.value.filter((g) => g.name === name);
		if (target < 1 || current.length === 0 || target === current.length) return;
		const previous = [...dailyGoalsList.value];
		if (target > current.length) {
			const extra = Array.from({ length: target - current.length }, () =>
				slim(current[0], { id: nanoid(), name }) as Goal,
			);
			const lastIdx = dailyGoalsList.value.map((g) => g.name).lastIndexOf(name);
			const list = [...dailyGoalsList.value];
			list.splice(lastIdx + 1, 0, ...extra);
			dailyGoalsList.value = list;
		} else {
			let toDrop = current.length - target;
			const list = [...dailyGoalsList.value];
			for (let i = list.length - 1; i >= 0 && toDrop > 0; i--) {
				if (list[i].name === name) {
					list.splice(i, 1);
					toDrop--;
				}
			}
			dailyGoalsList.value = list;
		}
		await persistGoals(previous);
	}

	async function reorderGoals(names: string[]) {
		const previous = [...dailyGoalsList.value];
		dailyGoalsList.value = names.flatMap((n) => previous.filter((g) => g.name === n));
		await persistGoals(previous);
	}

	// Stuknięcie w cel: dopóki nie osiągnięto celu → +1, potem → cofnij jedno
	function tapGoal(goal: GroupedGoal) {
		if (goal.done < goal.target) {
			return logHabit(goal.habit) ? ("logged" as const) : null;
		}
		return unlogHabit(goal.name) ? ("unlogged" as const) : null;
	}

	// ==========================================================================
	// WŁASNE HABITY
	// ==========================================================================
	async function saveCustomHabits(previous: Habit[]) {
		const currentUid = uid.value;
		if (!currentUid) return;
		try {
			await saveUserFields(currentUid, {
				customHabbits: customHabits.value.map((h) => plain(h)),
			});
		} catch (err) {
			console.error("saveCustomHabits failed", err);
			customHabits.value = previous;
			toast.error(SAVE_ERROR);
		}
	}

	async function createCustomHabit(label: string, icon: string, negative = false) {
		const displayName = label.trim().slice(0, 40);
		const existing = allHabitsList.value.find(
			(h) => (h.display_name || h.name).toLowerCase() === displayName.toLowerCase(),
		);
		if (existing) return existing;
		const habit: Habit = {
			name: `u_${nanoid(10)}`,
			display_name: displayName,
			icon,
			severity: negative ? "danger" : "success",
			tags: [],
			origin: "user",
			category: "Your habits",
		};
		const previous = [...customHabits.value];
		customHabits.value = [habit, ...customHabits.value];
		saveCustomHabits(previous);
		return habit;
	}

	async function deleteCustomHabit(name: string) {
		const previous = [...customHabits.value];
		customHabits.value = customHabits.value.filter((h) => h.name !== name);
		await saveCustomHabits(previous);
	}

	// ==========================================================================
	// NAWIGACJA PO DATACH
	// ==========================================================================
	function setDate(date: Date) {
		const day = startOfDay(date);
		if (toDateKey(day) > todayKey.value) return; // przyszłości nie planujemy tutaj
		selectedDate.value = day;
		ensureMonthFor(day);
	}

	function changeDate(direction: number) {
		setDate(addDays(selectedDate.value, direction));
	}

	function goToToday() {
		setDate(new Date());
	}

	function clearData() {
		days.value = {};
		dailyGoalsList.value = [];
		recentHabits.value = [];
		customHabits.value = [];
		loadedMonths.clear();
		pendingMonths.clear();
		pendingDays.clear();
		selectedDate.value = startOfDay();
		todayKey.value = computeTodayKey();
	}

	return {
		// stan
		todayKey,
		selectedDate,
		selectedKey,
		isSelectedToday,
		days,
		dailyGoalsList,
		recentHabits,
		customHabits,
		allHabitsList,
		isHistoryLoading,
		// odczyt
		resolve,
		logsOn,
		countsOn,
		groupLogs,
		hasLogsOn,
		selectedLogs,
		selectedCounts,
		groupedSelectedDayHabits,
		groupedGoals,
		goalsProgress,
		goalsFor,
		dayGoalsProgress,
		streak,
		streakAtRisk,
		// wczytywanie
		hydrate,
		loadInitialHistory,
		ensureRange,
		ensureMonth,
		// wpisy
		logHabit,
		unlogHabit,
		removeLog,
		removeAllLogs,
		restoreLogs,
		reorderSelected,
		// cele
		addDailyGoal,
		removeGoalInstance,
		removeGoal,
		restoreGoals,
		setGoalTarget,
		reorderGoals,
		tapGoal,
		// własne habity
		createCustomHabit,
		deleteCustomHabit,
		// daty
		setDate,
		changeDate,
		goToToday,
		clearData,
	};
});
