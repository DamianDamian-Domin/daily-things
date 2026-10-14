import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Unsubscribe } from "firebase/firestore";
import { useAuthStore } from "@/stores/auth";
import { useHabitsStore } from "@/stores/habits";
import { useProfileStore } from "@/stores/profile";
import { useProfileSyncStore } from "@/stores/profileSync";
import { INVITE_KEY } from "@/stores/social";
import { useToastStore } from "@/stores/toast";
import { useCarouselStore } from "@/stores/useCarouselStore";
import {
	MAX_FRIENDS,
	acceptFriendRequest,
	clearInbox,
	fetchFriendship,
	fetchInbox,
	isValidCode,
	lookupFriendCode,
	normalizeCode,
	pairIdOf,
	removeFriendship,
	sendCheer,
	sendFriendRequest,
	watchFriendships,
	watchInbox,
	watchProfile,
	type Cheer,
	type CodeCard,
	type Friendship,
	type ProfileStats,
	type PublicProfile,
} from "@/services/friends";
import type { AvatarConfig } from "@/utils/avatar";
import { addDays, fromDateKey, startOfWeek, toDateKey, type DateKey } from "@/utils/date";
import { liveStreak } from "@/utils/streak";

// Słuchacze wyłączamy z opóźnieniem — szybkie przełączanie kart nie
// powoduje ponownego czytania wszystkich profili
const STOP_DELAY_MS = 60_000;
const UNDO_MS = 5000;

export interface FriendRow {
	uid: string;
	pairId: string;
	name: string;
	avatar: AvatarConfig;
	profile: PublicProfile | null;
	// Dzisiejsze cele (null = jeszcze nic dziś / ukryte)
	today: { done: number; total: number } | null;
	streak: number | null;
	shares: boolean;
	// Znajomy jeszcze dziś nie zaglądał (dane z poprzedniego dnia)
	away: boolean;
}

export interface RequestRow {
	uid: string;
	pairId: string;
	name: string;
	avatar: AvatarConfig;
}

export interface BoardEntry {
	uid: string;
	isMe: boolean;
	name: string;
	avatar: AvatarConfig;
	done: number;
	total: number;
	ratio: number;
	pct: number;
	streak: number;
	rank: number;
}

export type RequestResult =
	| { ok: true; message: string }
	| { ok: false; reason: "self" | "already" | "pending" | "limit" | "error"; message: string };

function readStorage(key: string, session = false): string | null {
	try {
		return (session ? sessionStorage : localStorage).getItem(key);
	} catch {
		return null;
	}
}
function writeStorage(key: string, value: string | null, session = false) {
	try {
		const storage = session ? sessionStorage : localStorage;
		if (value === null) storage.removeItem(key);
		else storage.setItem(key, value);
	} catch {
		/* brak dostępu do storage */
	}
}

function errorCode(err: unknown): string | undefined {
	return (err as { code?: string })?.code;
}

export const useFriendsStore = defineStore("friends", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const profileStore = useProfileStore();
	const profileSync = useProfileSyncStore();
	const toast = useToastStore();
	const carouselStore = useCarouselStore();

	const uid = computed(() => authStore.userUid);

	// ==========================================
	// STAN
	// ==========================================
	const friendships = shallowRef<Friendship[]>([]);
	const profiles = ref<Record<string, PublicProfile | null>>({});
	const loaded = ref(false);
	const live = ref(false);
	const listenError = ref(false);
	// Znajomości „w trakcie usuwania” (okno na Cofnij)
	const hidden = ref<Set<string>>(new Set());
	const pendingInvite = ref<string | null>(null);

	let unsubFriendships: Unsubscribe | null = null;
	let unsubInbox: Unsubscribe | null = null;
	const profileUnsubs = new Map<string, Unsubscribe>();
	const profileRetries = new Map<string, number>();
	let stopTimer: ReturnType<typeof setTimeout> | null = null;
	const removeTimers = new Map<string, ReturnType<typeof setTimeout>>();

	// ==========================================
	// SŁUCHACZE (aktywne tylko, gdy karta Znajomi jest widoczna)
	// ==========================================
	function start() {
		if (stopTimer) {
			clearTimeout(stopTimer);
			stopTimer = null;
		}
		const me = uid.value;
		if (!me || authStore.isGuest || live.value) return;
		live.value = true;
		listenError.value = false;
		loadCheered();
		unsubFriendships = watchFriendships(
			me,
			(list, fromCache) => {
				if (uid.value !== me) return;
				friendships.value = list;
				loaded.value = true;
				syncProfileListeners();
				// Profil czytają znajomi; wysłane zaproszenie może zostać przyjęte w każdej chwili
				if (!fromCache) {
					profileSync.setHasFriends(
						list.some((f) => f.status === "accepted" || f.requestedBy === me),
					);
				}
			},
			(err) => {
				console.error("Friendships listener failed", err);
				listenError.value = true;
				loaded.value = true;
			},
		);
		unsubInbox = watchInbox(
			me,
			(list) => handleInbox(list),
			(err) => console.warn("Inbox listener failed", err),
		);
	}

	function stop() {
		if (stopTimer) clearTimeout(stopTimer);
		stopTimer = null;
		unsubFriendships?.();
		unsubInbox?.();
		unsubFriendships = null;
		unsubInbox = null;
		for (const unsub of profileUnsubs.values()) unsub();
		profileUnsubs.clear();
		profileRetries.clear();
		live.value = false;
	}

	function stopSoon() {
		if (!live.value || stopTimer) return;
		stopTimer = setTimeout(stop, STOP_DELAY_MS);
	}

	function otherOf(f: Friendship): string {
		return f.members[0] === uid.value ? f.members[1] : f.members[0];
	}

	// Jeden słuchacz na profil zaakceptowanego znajomego (reguły sprawdzają
	// znajomość per dokument, więc zapytanie „in” nie przejdzie)
	function syncProfileListeners() {
		const wanted = new Set(
			friendships.value.filter((f) => f.status === "accepted").map(otherOf),
		);
		for (const friendUid of wanted) {
			if (profileUnsubs.has(friendUid)) continue;
			const unsub = watchProfile(
				friendUid,
				(profile) => {
					profileRetries.delete(friendUid);
					profiles.value = { ...profiles.value, [friendUid]: profile };
				},
				(err) => {
					profileUnsubs.delete(friendUid);
					const denied = errorCode(err) === "permission-denied";
					if (!denied) console.warn("Profile listener failed", err);
					// Tuż po naszej akceptacji lokalny stan wyprzedza serwer — ponawiamy
					// kilka razy, dopóki znajomość u nas nadal jest zaakceptowana
					const tries = profileRetries.get(friendUid) ?? 0;
					if (denied && tries < 3 && live.value) {
						profileRetries.set(friendUid, tries + 1);
						setTimeout(() => {
							if (live.value) syncProfileListeners();
						}, 1500 * (tries + 1));
						return;
					}
					// np. znajomość właśnie usunięta — reguły odcinają dostęp
					const next = { ...profiles.value };
					delete next[friendUid];
					profiles.value = next;
				},
			);
			profileUnsubs.set(friendUid, unsub);
		}
		for (const [friendUid, unsub] of profileUnsubs) {
			if (wanted.has(friendUid)) continue;
			unsub();
			profileUnsubs.delete(friendUid);
			const next = { ...profiles.value };
			delete next[friendUid];
			profiles.value = next;
		}
	}

	// ==========================================
	// WIDOKI
	// ==========================================
	const visible = computed(() => friendships.value.filter((f) => !hidden.value.has(f.id)));

	const friends = computed<FriendRow[]>(() => {
		const today = habitsStore.todayKey;
		return visible.value
			.filter((f) => f.status === "accepted")
			.map((f) => {
				const friendUid = otherOf(f);
				const snapshot = f.requestedBy === uid.value ? f.to : f.from;
				const profile = profiles.value[friendUid] ?? null;
				const stats = profile?.sharing.progress ? profile.stats : null;
				return {
					uid: friendUid,
					pairId: f.id,
					name: profile?.displayName ?? snapshot.name,
					avatar: profile?.avatar ?? snapshot.avatar,
					profile,
					today:
						stats && stats.todayKey === today && stats.todayTotal > 0
							? { done: stats.todayDone, total: stats.todayTotal }
							: null,
					streak: stats ? liveStreak(stats, today) : null,
					shares: Boolean(stats),
					away: Boolean(stats && stats.todayKey !== today),
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	const incoming = computed<RequestRow[]>(() =>
		visible.value
			.filter((f) => f.status === "pending" && f.requestedBy !== uid.value)
			.map((f) => ({ uid: otherOf(f), pairId: f.id, name: f.from.name, avatar: f.from.avatar })),
	);

	const outgoing = computed<RequestRow[]>(() =>
		visible.value
			.filter((f) => f.status === "pending" && f.requestedBy === uid.value)
			.map((f) => ({ uid: otherOf(f), pairId: f.id, name: f.to.name, avatar: f.to.avatar })),
	);

	// ==========================================
	// TABLICA TYGODNIA (% celów od poniedziałku; remis → dłuższa seria)
	// ==========================================
	const weekKeys = computed(() => {
		const today = fromDateKey(habitsStore.todayKey);
		const keys: DateKey[] = [];
		for (let d = startOfWeek(today); d <= today; d = addDays(d, 1)) keys.push(toDateKey(d));
		return keys;
	});

	function friendWeek(stats: ProfileStats) {
		let done = 0;
		let total = 0;
		for (const key of weekKeys.value) {
			const day = stats.last7.find((d) => d.date === key);
			if (day) {
				done += day.done;
				total += day.total;
			} else if (key > stats.todayKey) {
				// Znajomy jeszcze nie zajrzał tego dnia — cele „czekają”
				total += stats.todayTotal;
			}
		}
		return { done, total };
	}

	const board = computed<BoardEntry[]>(() => {
		let myDone = 0;
		let myTotal = 0;
		for (const key of weekKeys.value) {
			const day = habitsStore.dayGoalsProgress(key);
			myDone += day.done;
			myTotal += day.total;
		}
		const entries: Omit<BoardEntry, "rank">[] = [
			{
				uid: uid.value ?? "me",
				isMe: true,
				name: "You",
				avatar: profileStore.avatar,
				done: myDone,
				total: myTotal,
				ratio: myTotal ? myDone / myTotal : 0,
				pct: myTotal ? Math.round((myDone / myTotal) * 100) : 0,
				streak: habitsStore.streak,
			},
		];
		for (const f of friends.value) {
			const stats = f.profile?.sharing.progress ? f.profile.stats : null;
			if (!stats) continue;
			const week = friendWeek(stats);
			entries.push({
				uid: f.uid,
				isMe: false,
				name: f.name,
				avatar: f.avatar,
				done: week.done,
				total: week.total,
				ratio: week.total ? week.done / week.total : 0,
				pct: week.total ? Math.round((week.done / week.total) * 100) : 0,
				streak: f.streak ?? 0,
			});
		}
		const better = (a: Omit<BoardEntry, "rank">, b: Omit<BoardEntry, "rank">) =>
			a.ratio > b.ratio || (a.ratio === b.ratio && a.streak > b.streak);
		return entries
			.map((e) => ({ ...e, rank: 1 + entries.filter((o) => better(o, e)).length }))
			.sort((a, b) => a.rank - b.rank || Number(b.isMe) - Number(a.isMe) || a.name.localeCompare(b.name));
	});

	const boardMessage = computed(() => {
		const entries = board.value;
		const meEntry = entries.find((e) => e.isMe);
		if (!meEntry || entries.length < 2) return "";
		if (meEntry.total === 0) return "Set a daily goal to join the board 🌱";
		const tied = entries.filter((e) => !e.isMe && e.rank === meEntry.rank);
		if (meEntry.rank === 1) {
			return tied.length
				? `You're sharing the top spot with ${tied[0].name} 🤝`
				: "You're leading this week ✨ Lovely rhythm.";
		}
		// Najbliższa osoba przed nami
		const ahead = entries.filter((e) => e.rank < meEntry.rank);
		const target = ahead[ahead.length - 1];
		const need = Math.ceil(target.ratio * meEntry.total - meEntry.done - 1e-9);
		if (need <= 0) return `Neck and neck with ${target.name} 🌱`;
		return `You're #${meEntry.rank} this week. ${need} more ${need === 1 ? "goal" : "goals"} to catch ${target.name} 🌱`;
	});

	// ==========================================
	// DODAWANIE
	// ==========================================
	async function lookup(rawCode: string): Promise<CodeCard | null> {
		const code = normalizeCode(rawCode);
		if (!isValidCode(code)) return null;
		return lookupFriendCode(code);
	}

	async function sendRequest(card: CodeCard): Promise<RequestResult> {
		const me = uid.value;
		if (!me || authStore.isGuest) return { ok: false, reason: "error", message: "Sign in first." };
		if (card.uid === me) {
			return { ok: false, reason: "self", message: "That's your own code 🙂" };
		}
		const accepted = friendships.value.filter((f) => f.status === "accepted").length;
		if (accepted >= MAX_FRIENDS) {
			return { ok: false, reason: "limit", message: `You can have up to ${MAX_FRIENDS} friends.` };
		}
		try {
			const existing =
				friendships.value.find((f) => f.id === pairIdOf(me, card.uid)) ??
				(await fetchFriendship(pairIdOf(me, card.uid)));
			if (existing?.status === "accepted") {
				return { ok: false, reason: "already", message: `You and ${card.name} are already friends 🌻` };
			}
			if (existing && existing.requestedBy === me) {
				return { ok: false, reason: "pending", message: `Request already sent — waiting for ${card.name}.` };
			}
			if (existing) {
				// Druga osoba zaprosiła nas pierwsza — po prostu akceptujemy
				await acceptFriendRequest(me, card.uid, profileStore.publicName);
				profileSync.setHasFriends(true);
				return { ok: true, message: `You and ${card.name} are now friends 🌻` };
			}
			await sendFriendRequest(me, card.uid, profileStore.me, { name: card.name, avatar: card.avatar });
			profileSync.setHasFriends(true);
			return { ok: true, message: `Request sent to ${card.name} 💌` };
		} catch (err) {
			console.error("Friend request failed", err);
			return {
				ok: false,
				reason: "error",
				message: "Couldn't send the request — check your connection and try again.",
			};
		}
	}

	async function accept(row: RequestRow) {
		const me = uid.value;
		if (!me) return;
		try {
			await acceptFriendRequest(me, row.uid, profileStore.publicName);
			profileSync.setHasFriends(true);
			toast.show(`You and ${row.name} are now friends 🌻`, { tone: "success" });
		} catch (err) {
			console.error("Accept failed", err);
			toast.error("Couldn't accept the request — try again in a moment.");
		}
	}

	// Odrzucenie / anulowanie / usunięcie: od razu znika z listy, a zapis
	// leci dopiero po oknie na „Cofnij”
	function removeWithUndo(row: { uid: string; pairId: string }, message: string) {
		const me = uid.value;
		if (!me) return;
		const next = new Set(hidden.value);
		next.add(row.pairId);
		hidden.value = next;
		const timer = setTimeout(() => {
			removeTimers.delete(row.pairId);
			removeFriendship(me, row.uid)
				.catch((err) => {
					console.error("Remove friendship failed", err);
					if (uid.value === me) toast.error("Couldn't update your friends — try again.");
				})
				.finally(() => {
					const after = new Set(hidden.value);
					after.delete(row.pairId);
					hidden.value = after;
				});
		}, UNDO_MS + 200);
		removeTimers.set(row.pairId, timer);
		toast.undoable(message, () => {
			clearTimeout(timer);
			removeTimers.delete(row.pairId);
			const after = new Set(hidden.value);
			after.delete(row.pairId);
			hidden.value = after;
		});
	}

	function decline(row: RequestRow) {
		removeWithUndo(row, `Request from ${row.name} declined`);
	}
	function cancel(row: RequestRow) {
		removeWithUndo(row, `Request to ${row.name} cancelled`);
	}
	function unfriend(row: FriendRow) {
		removeWithUndo(row, `${row.name} removed from friends`);
	}

	// ==========================================
	// PIĄTKA 👏 (raz dziennie na znajomego)
	// ==========================================
	const cheered = ref<Record<string, string>>({});
	function loadCheered() {
		try {
			cheered.value = JSON.parse(readStorage(`dt-cheered:${uid.value}`) ?? "{}");
		} catch {
			cheered.value = {};
		}
	}
	function hasCheeredToday(friendUid: string) {
		return cheered.value[friendUid] === habitsStore.todayKey;
	}

	async function cheer(row: FriendRow) {
		const me = uid.value;
		if (!me || hasCheeredToday(row.uid)) return;
		const previous = { ...cheered.value };
		cheered.value = { ...cheered.value, [row.uid]: habitsStore.todayKey };
		try {
			await sendCheer(me, row.uid, profileStore.publicName);
			writeStorage(`dt-cheered:${me}`, JSON.stringify(cheered.value));
			toast.show(`High-five sent to ${row.name} 👏`, { tone: "celebrate" });
		} catch (err) {
			cheered.value = previous;
			console.error("Cheer failed", err);
			toast.error(
				errorCode(err) === "permission-denied"
					? `You just high-fived ${row.name} — give it a minute ✋`
					: "Couldn't send the high-five — try again.",
			);
		}
	}

	// ==========================================
	// SKRZYNKA (piątki, zaproszenia, akceptacje) — toast i usunięcie
	// ==========================================
	const handled = new Set<string>();
	function handleInbox(list: Cheer[]) {
		const me = uid.value;
		// Ten sam nadawca może przybić piątkę znów jutro (to samo id) — klucz z czasem
		const keyOf = (c: Cheer) => `${c.id}:${c.kind}:${c.at}`;
		const fresh = list.filter((c) => !handled.has(keyOf(c)));
		if (!me || fresh.length === 0) return;
		fresh.forEach((c) => handled.add(keyOf(c)));
		if (fresh.some((c) => c.kind !== "request")) profileSync.setHasFriends(true);
		const view = () => carouselStore.setActiveCard("friends");
		if (fresh.length > 2) {
			toast.show(`${fresh.length} little notes from friends 🌻`, { actionLabel: "View", action: view });
		} else {
			for (const c of fresh) {
				if (c.kind === "cheer") toast.show(`${c.name} high-fived you 👏`, { tone: "celebrate", duration: 4500 });
				else if (c.kind === "accept")
					toast.show(`${c.name} accepted your friend request 🎉`, { tone: "success", duration: 4500 });
				else toast.show(`${c.name} wants to be friends 🌱`, { actionLabel: "View", action: view });
			}
		}
		clearInbox(
			me,
			fresh.map((c) => c.id),
		).catch((err) => console.warn("Inbox cleanup failed", err));
	}

	// Raz na wczytanie sesji (1 zapytanie) — czy ktoś przybił piątkę?
	async function checkInbox() {
		const me = uid.value;
		if (!me || authStore.isGuest) return;
		loadCheered();
		try {
			const list = await fetchInbox(me);
			if (uid.value === me) handleInbox(list);
		} catch (err) {
			console.warn("Inbox check failed", err);
		}
	}

	// ==========================================
	// ZAPROSZENIE Z LINKU (?invite=KOD)
	// ==========================================
	// Kod z linku zapamiętujemy w sessionStorage — przetrwa rejestrację
	// i przeładowanie strony, a „Dodać Anię?” pokażemy po zalogowaniu
	function captureInvite(raw: string | null) {
		if (raw !== null) {
			const code = normalizeCode(raw);
			if (isValidCode(code)) {
				pendingInvite.value = code;
				writeStorage(INVITE_KEY, code, true);
			}
		} else {
			const stored = readStorage(INVITE_KEY, true);
			if (stored && isValidCode(stored)) pendingInvite.value = stored;
		}
		if (pendingInvite.value) carouselStore.setActiveCard("friends");
	}

	function clearInvite() {
		pendingInvite.value = null;
		writeStorage(INVITE_KEY, null, true);
	}

	function inviteLink(code: string) {
		const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
		// W aplikacji natywnej origin to localhost — bez publicznego adresu dzielimy się samym kodem
		if (!/^https?:\/\/(?!localhost)/.test(base) && !import.meta.env.DEV) return null;
		return `${base.replace(/\/$/, "")}/?invite=${code}`;
	}

	// ==========================================
	// SPRZĄTANIE (wylogowanie, zmiana konta)
	// ==========================================
	function clear() {
		stop();
		for (const timer of removeTimers.values()) clearTimeout(timer);
		removeTimers.clear();
		friendships.value = [];
		profiles.value = {};
		loaded.value = false;
		listenError.value = false;
		hidden.value = new Set();
		cheered.value = {};
		handled.clear();
	}

	return {
		// stan
		friendships,
		profiles,
		loaded,
		live,
		listenError,
		pendingInvite,
		// widoki
		friends,
		incoming,
		outgoing,
		board,
		boardMessage,
		// akcje
		start,
		stop,
		stopSoon,
		lookup,
		sendRequest,
		accept,
		decline,
		cancel,
		unfriend,
		cheer,
		hasCheeredToday,
		checkInbox,
		captureInvite,
		clearInvite,
		inviteLink,
		clear,
	};
});
