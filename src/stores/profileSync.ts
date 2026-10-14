import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useAchievementsStore } from "@/stores/achievements";
import { useAuthStore } from "@/stores/auth";
import { useHabitsStore } from "@/stores/habits";
import { useProfileStore } from "@/stores/profile";
import { usePreferencesStore } from "@/stores/userPreferences";
import { saveUserFields } from "@/services/userData";
import {
	createFriendCode,
	hasAnyFriendship,
	saveProfile,
	updateFriendCode,
	type ProfileStats,
	type ProfileWrite,
	type SharedHabit,
} from "@/services/friends";
import { addDays, fromDateKey, toDateKey } from "@/utils/date";
import { isNegative, paletteFor } from "@/utils/habitCatalog";
import { plain } from "@/utils/plain";

// ==========================================================================
// Publikacja mojego profilu dla znajomych (profiles/{uid}) i cykl życia
// kodu znajomego. Ładowany leniwie (stores/social.ts) tylko dla kont —
// goście nigdy go nie pobierają. Działa sam: reaguje na `profile.ready`.
// ==========================================================================

// Seria kliknięć = jeden zapis
const SYNC_DELAY_MS = 2500;
const SHARED_HABITS_LIMIT = 12;

function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function writeStorage(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* brak dostępu do storage — najwyżej zapiszemy profil jeszcze raz */
	}
}

export const useProfileSyncStore = defineStore("profileSync", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const preferences = usePreferencesStore();
	const profile = useProfileStore();
	const achievements = useAchievementsStore();

	const uid = computed(() => authStore.userUid);
	const active = computed(() => profile.isSocial && profile.ready);

	// Czy ktoś w ogóle może czytać nasz profil (znajomy lub wysłane zaproszenie).
	// Bez znajomych nie publikujemy statystyk — zero dodatkowych zapisów przy
	// każdym odhaczeniu. null = jeszcze nie wiemy (traktujemy jak „tak”).
	const hasFriends = ref<boolean | null>(null);

	// Timery i blokady (na górze — watchery z `immediate` korzystają z nich od razu)
	let syncTimer: ReturnType<typeof setTimeout> | null = null;
	let codeTimer: ReturnType<typeof setTimeout> | null = null;
	let syncing = false;
	let ensuring: Promise<void> | null = null;

	function setHasFriends(value: boolean) {
		const currentUid = uid.value;
		if (!currentUid) return;
		const turnedOn = value && hasFriends.value !== true;
		hasFriends.value = value;
		writeStorage(`dt-has-friends:${currentUid}`, value ? "1" : "0");
		// Ktoś nas właśnie zobaczy — publikujemy świeże statystyki od razu
		if (turnedOn) scheduleSync(300);
	}

	// ==========================================
	// START / RESET (nowa sesja, zmiana konta, gość → konto)
	// ==========================================
	watch(
		[active, uid],
		([on]) => {
			if (syncTimer) clearTimeout(syncTimer);
			if (codeTimer) clearTimeout(codeTimer);
			syncTimer = null;
			codeTimer = null;
			hasFriends.value = null;
			if (!on || !uid.value) return;
			const currentUid = uid.value;
			const stored = readStorage(`dt-has-friends:${currentUid}`);
			hasFriends.value = stored === "1" ? true : stored === "0" ? false : null;
			if (!profile.friendCode) {
				ensureFriendCode();
			} else if (hasFriends.value === null) {
				// Nowe urządzenie: jedno zapytanie (limit 1) zamiast publikowania „na zapas”
				hasAnyFriendship(currentUid)
					.then((any) => {
						if (uid.value === currentUid) setHasFriends(any);
					})
					.catch((err) => console.warn("Friendship check failed", err));
			}
		},
		{ immediate: true },
	);

	// ==========================================
	// KOD ZNAJOMEGO (tworzony, gdy konto jest — lub staje się — nieanonimowe)
	// ==========================================
	function ensureFriendCode(): Promise<void> {
		if (!active.value || profile.friendCode) return Promise.resolve();
		if (ensuring) return ensuring;
		const currentUid = uid.value!;
		const person = profile.me;
		ensuring = (async () => {
			try {
				const code = await createFriendCode(currentUid, person);
				if (uid.value !== currentUid) return;
				profile.setFriendCode(code);
				writeStorage(`dt-code-sig:${currentUid}`, JSON.stringify(person));
				// Świeży kod = jeszcze nikt nas nie zna
				if (hasFriends.value === null) setHasFriends(false);
				await saveUserFields(currentUid, { friendCode: code });
			} catch (err) {
				console.warn("Friend code setup failed", err);
			} finally {
				ensuring = null;
			}
		})();
		return ensuring;
	}

	// ==========================================
	// STATYSTYKI
	// ==========================================
	function buildStats(): ProfileStats {
		const today = habitsStore.todayKey;
		const todayDate = fromDateKey(today);
		const progress = habitsStore.dayGoalsProgress(today);
		const last7 = Array.from({ length: 7 }, (_, i) => {
			const key = toDateKey(addDays(todayDate, i - 6));
			const day = habitsStore.dayGoalsProgress(key);
			return { date: key, done: day.done, total: day.total };
		});
		return {
			streak: habitsStore.streak,
			streakEnd: habitsStore.hasLogsOn(today) ? today : toDateKey(addDays(todayDate, -1)),
			todayKey: today,
			todayDone: progress.done,
			todayTotal: progress.total,
			last7,
			badges: [...achievements.unlockedIds],
		};
	}

	// Tylko pozytywne habity — negatywnych nigdy nie pokazujemy znajomym
	function buildHabits(): SharedHabit[] {
		const logs = habitsStore.logsOn(habitsStore.todayKey);
		return habitsStore
			.groupLogs(logs)
			.filter((g) => !isNegative(g.habit))
			.slice(0, SHARED_HABITS_LIMIT)
			.map((g) => ({
				name: g.habit.display_name || g.name,
				icon: g.habit.icon,
				palette: paletteFor(g.habit),
				count: g.count,
			}));
	}

	const payload = computed<ProfileWrite | null>(() => {
		if (!active.value || !profile.friendCode) return null;
		const progress = preferences.shareProgress;
		const card: ProfileWrite = {
			displayName: profile.publicName,
			avatar: plain(profile.avatar),
			friendCode: profile.friendCode,
			sharing: { progress, habits: preferences.shareHabits },
		};
		// Bez znajomych: tylko wizytówka (i wyczyszczenie statystyk, gdy ktoś
		// wyłączył udostępnianie) — nie zależy od habitów, więc nie zapisuje się co chwilę
		if (hasFriends.value === false) {
			return progress ? card : { ...card, stats: null, todayHabits: null };
		}
		return {
			...card,
			stats: progress ? buildStats() : null,
			todayHabits: progress && preferences.shareHabits ? buildHabits() : null,
		};
	});

	async function flushProfile() {
		syncTimer = null;
		const data = payload.value;
		const currentUid = uid.value;
		if (!data || !currentUid) return;
		// Bez zmian = bez zapisu (podpis zapamiętany na tym urządzeniu)
		const signature = JSON.stringify(data);
		const sigKey = `dt-profile-sig:${currentUid}`;
		if (readStorage(sigKey) === signature) return;
		if (syncing) {
			scheduleSync();
			return;
		}
		syncing = true;
		try {
			await saveProfile(currentUid, data);
			writeStorage(sigKey, signature);
		} catch (err) {
			// Profil to „kopia” danych — spróbujemy przy następnej zmianie
			console.warn("Profile sync failed", err);
		} finally {
			syncing = false;
		}
	}

	function scheduleSync(delay = SYNC_DELAY_MS) {
		if (syncTimer) clearTimeout(syncTimer);
		syncTimer = setTimeout(flushProfile, delay);
	}

	watch(
		payload,
		(data) => {
			if (data) scheduleSync();
		},
		{ immediate: true },
	);

	// Wizytówka kodu (imię + awatar w „Dodać Anię?”) — tylko gdy się zmieni
	watch(
		() => [profile.me, profile.friendCode, active.value] as const,
		() => {
			if (codeTimer) clearTimeout(codeTimer);
			const code = profile.friendCode;
			const currentUid = uid.value;
			if (!code || !currentUid || !active.value) return;
			codeTimer = setTimeout(() => {
				const person = profile.me;
				const signature = JSON.stringify(person);
				const sigKey = `dt-code-sig:${currentUid}`;
				if (readStorage(sigKey) === signature) return;
				updateFriendCode(code, person)
					.then(() => writeStorage(sigKey, signature))
					.catch((err) => console.warn("Friend code card update failed", err));
			}, SYNC_DELAY_MS);
		},
		{ immediate: true },
	);

	return { hasFriends, setHasFriends, flushProfile };
});
