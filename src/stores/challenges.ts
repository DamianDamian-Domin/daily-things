import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Unsubscribe } from "firebase/firestore";
import { useAuthStore } from "@/stores/auth";
import { useFriendsStore, type FriendRow } from "@/stores/friends";
import { useHabitsStore } from "@/stores/habits";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";
import { sendChallengeNote, type PersonSnapshot } from "@/services/friends";
import {
	createChallenge,
	joinChallenge,
	leaveChallenge,
	setCheckin,
	watchChallenges,
	type NewChallenge,
} from "@/services/challenges";
import { defaultAvatar, normalizeAvatar, type AvatarConfig } from "@/utils/avatar";
import {
	MAX_ACTIVE_CHALLENGES,
	challengeDays,
	checkableDays,
	daysLabel,
	hasCheckedIn,
	isStale,
	phaseOf,
	teamMessage,
	teamProgress,
	type Challenge,
	type ChallengePhase,
	type ChallengeProgress,
} from "@/utils/challenges";
import type { DateKey } from "@/utils/date";

// ==========================================================================
// Wyzwania ze znajomymi — słuchacz działa razem z kartą Znajomi
// (start/stop wywołuje magazyn znajomych). Gdy reguły Firestore nie są
// jeszcze wdrożone, sekcja po prostu się chowa i nie blokuje reszty karty.
// ==========================================================================

export interface ChallengeMember {
	uid: string;
	isMe: boolean;
	name: string;
	avatar: AvatarConfig;
	joined: boolean;
	count: number;
	// Kolejne dni wyzwania: odhaczone czy nie
	marks: boolean[];
	doneToday: boolean;
}

export interface ChallengeRow {
	challenge: Challenge;
	phase: ChallengePhase;
	label: string;
	message: string;
	progress: ChallengeProgress;
	members: ChallengeMember[];
	invitedBy: string;
	isInvite: boolean;
	// Dni, które mogę jeszcze odhaczyć (wczoraj, dziś)
	checkable: { day: DateKey; label: string; done: boolean }[];
}

function errorCode(err: unknown): string | undefined {
	return (err as { code?: string })?.code;
}

function readSeen(key: string): string[] {
	try {
		const list = JSON.parse(localStorage.getItem(key) ?? "[]");
		return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}

function writeSeen(key: string, ids: string[]) {
	try {
		localStorage.setItem(key, JSON.stringify(ids.slice(-100)));
	} catch {
		/* brak dostępu do storage */
	}
}

export const useChallengesStore = defineStore("challenges", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const profileStore = useProfileStore();
	const toast = useToastStore();

	const uid = computed(() => authStore.userUid);

	const list = shallowRef<Challenge[]>([]);
	const loaded = ref(false);
	// Brak dostępu (np. niewdrożone reguły) — sekcja znika, reszta działa
	const unavailable = ref(false);
	const busy = ref<Set<string>>(new Set());
	let unsub: Unsubscribe | null = null;

	function start(me: string) {
		if (unsub) return;
		unavailable.value = false;
		unsub = watchChallenges(
			me,
			(next) => {
				if (uid.value !== me) return;
				list.value = next;
				loaded.value = true;
				announceInvites(me);
			},
			(err) => {
				if (errorCode(err) === "permission-denied") {
					console.warn("Challenges unavailable — are the Firestore rules deployed?", err);
				} else {
					console.warn("Challenges listener failed", err);
				}
				unavailable.value = true;
				loaded.value = true;
				unsub = null;
			},
		);
	}

	function stop() {
		unsub?.();
		unsub = null;
	}

	function clear() {
		stop();
		list.value = [];
		loaded.value = false;
		unavailable.value = false;
		busy.value = new Set();
	}

	// ==========================================
	// WIDOKI
	// ==========================================
	function personOf(c: Challenge, memberUid: string, friendsByUid: Map<string, FriendRow>) {
		if (memberUid === uid.value) return { name: "You", avatar: profileStore.avatar };
		const friend = friendsByUid.get(memberUid);
		const snap = c.people[memberUid];
		return {
			name: friend?.name ?? snap?.name ?? "Friend",
			avatar: friend?.avatar ?? normalizeAvatar(snap?.avatar) ?? defaultAvatar(memberUid),
		};
	}

	const rows = computed<ChallengeRow[]>(() => {
		const me = uid.value;
		if (!me) return [];
		const today = habitsStore.todayKey;
		const friendsByUid = new Map(useFriendsStore().friends.map((f) => [f.uid, f]));
		return list.value
			.filter((c) => !isStale(c, today))
			.map((c) => {
				const days = challengeDays(c);
				const isInvite = !c.joined.includes(me);
				// Najpierw ja, potem dołączeni, na końcu zaproszeni
				const order = [...c.members].sort(
					(a, b) =>
						Number(b === me) - Number(a === me) ||
						Number(c.joined.includes(b)) - Number(c.joined.includes(a)),
				);
				const members = order.map((m) => {
					const done = new Set(c.checkins[m] ?? []);
					return {
						uid: m,
						isMe: m === me,
						...personOf(c, m, friendsByUid),
						joined: c.joined.includes(m),
						count: done.size,
						marks: days.map((d) => done.has(d)),
						doneToday: done.has(today),
					};
				});
				return {
					challenge: c,
					phase: phaseOf(c, today),
					label: daysLabel(c, today),
					message: teamMessage(c, today),
					progress: teamProgress(c, today),
					members,
					invitedBy: personOf(c, c.createdBy, friendsByUid).name,
					isInvite,
					checkable: isInvite
						? []
						: checkableDays(c, today).map((day) => ({
								day,
								label: day === today ? "Today" : "Yesterday",
								done: hasCheckedIn(c, me, day),
							})),
				};
			})
			.filter((r) => !(r.isInvite && r.phase === "finished"))
			.sort(
				(a, b) =>
					Number(b.isInvite) - Number(a.isInvite) ||
					PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
					b.challenge.start.localeCompare(a.challenge.start),
			);
	});

	const invites = computed(() => rows.value.filter((r) => r.isInvite));
	const mine = computed(() => rows.value.filter((r) => !r.isInvite));
	const activeCount = computed(() => mine.value.filter((r) => r.phase !== "finished").length);

	// ==========================================
	// ZAPROSZENIA — toast raz na wyzwanie (na urządzeniu)
	// ==========================================
	function announceInvites(me: string) {
		const key = `dt-challenge-invites:${me}`;
		const seen = new Set(readSeen(key));
		const fresh = invites.value.filter((r) => !seen.has(r.challenge.id));
		if (fresh.length === 0) return;
		fresh.forEach((r) => seen.add(r.challenge.id));
		writeSeen(key, [...seen]);
		const first = fresh[0];
		toast.show(
			fresh.length > 1
				? `${fresh.length} new challenges from friends 🏁`
				: `${first.invitedBy} invited you: ${first.challenge.title} for ${first.challenge.days} days 🏁`,
			{ tone: "celebrate", duration: 5000 },
		);
	}

	// ==========================================
	// AKCJE
	// ==========================================
	function markBusy(id: string, on: boolean) {
		const next = new Set(busy.value);
		if (on) next.add(id);
		else next.delete(id);
		busy.value = next;
	}

	async function create(input: NewChallenge, friends: FriendRow[]): Promise<boolean> {
		const me = uid.value;
		if (!me || authStore.isGuest || friends.length === 0) return false;
		if (activeCount.value >= MAX_ACTIVE_CHALLENGES) {
			toast.error(`You can run up to ${MAX_ACTIVE_CHALLENGES} challenges at once.`);
			return false;
		}
		const people: Record<string, PersonSnapshot> = { [me]: profileStore.me };
		for (const f of friends) people[f.uid] = { name: f.name, avatar: f.avatar };
		try {
			await createChallenge(me, input, people);
		} catch (err) {
			console.error("Create challenge failed", err);
			toast.error(
				errorCode(err) === "permission-denied"
					? "Challenges aren't switched on yet — try again later."
					: "Couldn't start the challenge — check your connection and try again.",
			);
			return false;
		}
		// Powiadomienie w skrzynce znajomych (najlepiej jak się da — bez błędów dla użytkownika)
		for (const f of friends) {
			sendChallengeNote(me, f.uid, profileStore.publicName).catch((err) =>
				console.warn("Challenge note failed", err),
			);
		}
		const names = friends.map((f) => f.name).join(", ");
		toast.show(`Challenge sent to ${names} 🏁`, { tone: "celebrate" });
		return true;
	}

	async function join(row: ChallengeRow) {
		const me = uid.value;
		if (!me || busy.value.has(row.challenge.id)) return;
		markBusy(row.challenge.id, true);
		try {
			await joinChallenge(row.challenge.id, me);
			toast.show(`You're in! ${row.challenge.title} with ${row.invitedBy} 💪`, { tone: "celebrate" });
		} catch (err) {
			console.error("Join challenge failed", err);
			toast.error("Couldn't join the challenge — try again.");
		} finally {
			markBusy(row.challenge.id, false);
		}
	}

	async function leave(row: ChallengeRow) {
		const me = uid.value;
		if (!me || busy.value.has(row.challenge.id)) return;
		markBusy(row.challenge.id, true);
		try {
			await leaveChallenge(row.challenge, me);
			toast.show(row.isInvite ? "Challenge declined" : `You left “${row.challenge.title}”`);
		} catch (err) {
			console.error("Leave challenge failed", err);
			toast.error("Couldn't update the challenge — try again.");
		} finally {
			markBusy(row.challenge.id, false);
		}
	}

	async function toggle(row: ChallengeRow, day: DateKey) {
		const me = uid.value;
		const key = `${row.challenge.id}:${day}`;
		if (!me || busy.value.has(key)) return;
		const done = !hasCheckedIn(row.challenge, me, day);
		markBusy(key, true);
		try {
			await setCheckin(row.challenge.id, me, day, done);
			if (done) {
				const others = row.members.filter((m) => m.joined && !m.isMe);
				const allDone = day === habitsStore.todayKey && others.length > 0 && others.every((m) => m.doneToday);
				toast.show(
					allDone ? "Everyone's done today ✨ Team high-five!" : `${row.challenge.title}: checked ✓ Keep going 💪`,
					{ tone: "celebrate" },
				);
			}
		} catch (err) {
			console.error("Check-in failed", err);
			toast.error("Couldn't save your check-in — try again.");
		} finally {
			markBusy(key, false);
		}
	}

	function isBusy(id: string) {
		return busy.value.has(id);
	}

	return {
		loaded,
		unavailable,
		rows,
		invites,
		mine,
		activeCount,
		start,
		stop,
		clear,
		create,
		join,
		leave,
		toggle,
		isBusy,
	};
});

const PHASE_ORDER: Record<ChallengePhase, number> = { active: 0, upcoming: 1, finished: 2 };
