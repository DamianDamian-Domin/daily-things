import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useHabitsStore } from "@/stores/habits";
import { useInsightsStore } from "@/stores/insights";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";
import { saveUserFields, type UserDoc } from "@/services/userData";
import {
	ACHIEVEMENTS,
	ACHIEVEMENTS_BY_ID,
	collectMetrics,
	earnedIds,
	type DaySummary,
} from "@/utils/achievements";
import { isNegative, superCategoryOf } from "@/utils/habitCatalog";
import { useConfetti } from "@/utils/useConfetti";

// Znacznik „zdobyte przed wprowadzeniem odznak” (data nieznana)
export const EARNED_EARLIER = 1;

// Ile osobnych toastów pokazać naraz — przy większej liczbie jeden zbiorczy
const MAX_SEPARATE_TOASTS = 2;

export const useAchievementsStore = defineStore("achievements", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const profileStore = useProfileStore();
	const insights = useInsightsStore();
	const toast = useToastStore();
	const { launch: launchConfetti } = useConfetti();

	// id → kiedy zdobyta (ms)
	const unlocked = ref<Record<string, number>>({});
	// Pierwsze uruchomienie po aktualizacji: zdobyte „wstecz” pokazujemy jednym toastem
	let firstRun = false;
	const friendsCount = ref(0);

	function hydrate(userDoc: UserDoc) {
		const stored = userDoc.achievements;
		firstRun = !stored || typeof stored !== "object";
		unlocked.value = firstRun ? {} : Object.fromEntries(
			Object.entries(stored!).filter(([id, at]) => ACHIEVEMENTS_BY_ID.has(id) && typeof at === "number"),
		);
	}

	function noteFriends(count: number) {
		friendsCount.value = Math.max(friendsCount.value, count);
	}

	// ==========================================
	// METRYKI z wczytanej historii
	// ==========================================
	const daySummaries = computed<DaySummary[]>(() =>
		Object.values(habitsStore.days).map((entry) => ({
			key: entry.date,
			perfect: habitsStore.dayGoalsProgress(entry.date).perfect,
			logs: entry.habits.map((log) => {
				const habit = habitsStore.resolve(log);
				const category = superCategoryOf(habit);
				return {
					at: log.at,
					negative: isNegative(habit),
					category: category && category.key !== "yours" ? category.key : null,
				};
			}),
		})),
	);

	const metrics = computed(() =>
		collectMetrics({
			days: daySummaries.value,
			currentStreak: habitsStore.streak,
			goalNames: new Set(habitsStore.dailyGoalsList.map((g) => g.name)).size,
			customHabits: habitsStore.customHabits.length,
			friends: friendsCount.value,
		}),
	);

	const earnedNow = computed(() => earnedIds(metrics.value));

	const list = computed(() =>
		ACHIEVEMENTS.map((def) => ({
			def,
			unlockedAt: unlocked.value[def.id] ?? null,
		})),
	);

	const unlockedIds = computed(() =>
		ACHIEVEMENTS.filter((a) => unlocked.value[a.id]).map((a) => a.id),
	);

	function unlockedBetween(from: number, to: number) {
		return ACHIEVEMENTS.filter((a) => {
			const at = unlocked.value[a.id];
			return at !== undefined && at >= from && at < to;
		});
	}

	// ==========================================
	// NOWE ODZNAKI → zapis + świętowanie
	// ==========================================
	// Liczymy dopiero, gdy historia jest wczytana (profile.ready), inaczej
	// pierwsze sekundy po starcie wyglądałyby jak „puste” konto
	watch(
		() => [profileStore.ready, earnedNow.value] as const,
		([ready, earned]) => {
			const uid = authStore.userUid;
			if (!ready || !uid) return;
			const fresh = earned.filter((id) => !unlocked.value[id]);
			if (fresh.length === 0) {
				if (firstRun) {
					// Zapisujemy pustą mapę — kolejne odznaki będą już „na żywo”
					firstRun = false;
					saveUserFields(uid, { achievements: {} }).catch(() => undefined);
				}
				return;
			}
			// Zdobyte „wstecz” (pierwsze uruchomienie) nie mają znanej daty
			const at = firstRun ? EARNED_EARLIER : Date.now();
			const next = { ...unlocked.value };
			for (const id of fresh) next[id] = at;
			unlocked.value = next;
			saveUserFields(uid, { achievements: { ...next } }).catch((err) =>
				console.warn("Achievements save failed", err),
			);
			celebrate(fresh, firstRun);
			firstRun = false;
		},
	);

	function celebrate(ids: string[], retroactive: boolean) {
		const view = () => insights.open("badges");
		if (retroactive || ids.length > MAX_SEPARATE_TOASTS) {
			const n = ids.length;
			toast.show(
				retroactive
					? `You've already earned ${n} ${n === 1 ? "badge" : "badges"} 🏅`
					: `${n} new badges unlocked 🏅`,
				{ tone: "celebrate", actionLabel: "See", action: view, duration: 6000 },
			);
			if (!retroactive) launchConfetti(80);
			return;
		}
		for (const id of ids) {
			const def = ACHIEVEMENTS_BY_ID.get(id);
			if (!def) continue;
			toast.show(`Badge unlocked: ${def.title} 🏅`, {
				tone: "celebrate",
				actionLabel: "See",
				action: view,
				duration: 6000,
			});
		}
		launchConfetti(80);
	}

	function clear() {
		unlocked.value = {};
		firstRun = false;
		friendsCount.value = 0;
	}

	return {
		unlocked,
		metrics,
		list,
		unlockedIds,
		unlockedBetween,
		hydrate,
		noteFriends,
		clear,
	};
});
