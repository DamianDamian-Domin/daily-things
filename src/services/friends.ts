import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	onSnapshot,
	query,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	writeBatch,
	type Timestamp,
	type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import { defaultAvatar, normalizeAvatar, type AvatarConfig } from "@/utils/avatar";

// ==========================================================================
// Model danych funkcji „Znajomi” (tylko konta nieanonimowe):
//   profiles/{uid}                 → to, co widzą znajomi: imię, awatar, kod,
//                                    ustawienia udostępniania, statystyki
//   profiles/{uid}/cheers/{fromUid} → skrzynka: piątka / zaproszenie / akceptacja
//   friendCodes/{CODE}             → { uid, name, avatar } (get tak, list nie)
//   friendships/{uidA_uidB}        → { members, requestedBy, status, from, to }
// Szczegóły i uprawnienia: firestore.rules
// ==========================================================================

export const MAX_FRIENDS = 50;
// Bez znaków mylących się na ekranie (0/O, 1/I/L)
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export interface ShareSettings {
	progress: boolean;
	habits: boolean;
}

export interface DayStat {
	date: string;
	done: number;
	total: number;
}

// Habit pokazywany znajomym (tylko pozytywne, gdy użytkownik na to pozwolił)
export interface SharedHabit {
	name: string;
	icon: string;
	palette: string;
	count: number;
}

export interface ProfileStats {
	streak: number;
	// Ostatni dzień wliczony do serii (dziś lub wczoraj) — pozwala ocenić,
	// czy seria wciąż trwa, gdy znajomy dawno nie otwierał aplikacji
	streakEnd: string;
	todayKey: string;
	todayDone: number;
	todayTotal: number;
	last7: DayStat[];
	// Zdobyte odznaki (id z utils/achievements.ts)
	badges?: string[];
}

export interface PublicProfile {
	displayName: string;
	avatar: AvatarConfig;
	friendCode: string;
	sharing: ShareSettings;
	stats: ProfileStats | null;
	todayHabits: SharedHabit[] | null;
	updatedAt?: Timestamp | null;
}

export interface PersonSnapshot {
	name: string;
	avatar: AvatarConfig;
}

export type FriendshipStatus = "pending" | "accepted";

export interface Friendship {
	id: string;
	members: [string, string];
	requestedBy: string;
	status: FriendshipStatus;
	from: PersonSnapshot;
	to: PersonSnapshot;
	createdAt?: Timestamp | null;
	acceptedAt?: Timestamp | null;
}

export type CheerKind = "cheer" | "request" | "accept";

export interface Cheer {
	id: string;
	from: string;
	kind: CheerKind;
	name: string;
	at: number;
}

export interface CodeCard extends PersonSnapshot {
	uid: string;
	code: string;
}

// --------------------------------------------------------------------------
// ŚCIEŻKI
// --------------------------------------------------------------------------
export const profileRef = (uid: string) => doc(db, "profiles", uid);
export const cheersRef = (uid: string) => collection(db, "profiles", uid, "cheers");
export const cheerRef = (toUid: string, fromUid: string) =>
	doc(db, "profiles", toUid, "cheers", fromUid);
export const codeRef = (code: string) => doc(db, "friendCodes", code);
export const friendshipRef = (pairId: string) => doc(db, "friendships", pairId);
const friendshipsRef = collection(db, "friendships");

export function pairIdOf(a: string, b: string): string {
	return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function normalizeCode(input: string): string {
	return input
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, CODE_LENGTH);
}

export function isValidCode(code: string): boolean {
	return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code);
}

function randomCode(): string {
	const bytes = new Uint32Array(CODE_LENGTH);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// --------------------------------------------------------------------------
// MAPOWANIE (dane z Firestore traktujemy jako niezaufane)
// --------------------------------------------------------------------------
function toPerson(raw: unknown, fallbackSeed: string): PersonSnapshot {
	const r = (raw ?? {}) as Partial<PersonSnapshot>;
	return {
		name: typeof r.name === "string" && r.name ? r.name.slice(0, 40) : "Friend",
		avatar: normalizeAvatar(r.avatar) ?? defaultAvatar(fallbackSeed),
	};
}

function num(v: unknown): number {
	return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

function toStats(raw: unknown): ProfileStats | null {
	if (!raw || typeof raw !== "object") return null;
	const r = raw as Record<string, unknown>;
	const last7 = Array.isArray(r.last7)
		? (r.last7 as Array<Record<string, unknown>>)
				.filter((d) => d && typeof d.date === "string")
				.slice(-7)
				.map((d) => ({ date: d.date as string, done: num(d.done), total: num(d.total) }))
		: [];
	return {
		streak: num(r.streak),
		streakEnd: typeof r.streakEnd === "string" ? r.streakEnd : "",
		todayKey: typeof r.todayKey === "string" ? r.todayKey : "",
		todayDone: num(r.todayDone),
		todayTotal: num(r.todayTotal),
		last7,
		badges: Array.isArray(r.badges)
			? r.badges.filter((b): b is string => typeof b === "string").slice(0, 40)
			: [],
	};
}

function toHabits(raw: unknown): SharedHabit[] | null {
	if (!Array.isArray(raw)) return null;
	return raw
		.filter((h) => h && typeof h.icon === "string")
		.slice(0, 12)
		.map((h) => ({
			name: typeof h.name === "string" ? h.name.slice(0, 40) : "",
			icon: h.icon,
			palette: typeof h.palette === "string" ? h.palette : "orange",
			count: Math.max(1, num(h.count)),
		}));
}

export function toProfile(uid: string, raw: Record<string, unknown> | undefined): PublicProfile | null {
	if (!raw) return null;
	const sharing = (raw.sharing ?? {}) as Partial<ShareSettings>;
	return {
		displayName:
			typeof raw.displayName === "string" && raw.displayName ? raw.displayName : "Friend",
		avatar: normalizeAvatar(raw.avatar) ?? defaultAvatar(uid),
		friendCode: typeof raw.friendCode === "string" ? raw.friendCode : "",
		sharing: { progress: sharing.progress !== false, habits: sharing.habits !== false },
		stats: toStats(raw.stats),
		todayHabits: toHabits(raw.todayHabits),
		updatedAt: (raw.updatedAt as Timestamp | undefined) ?? null,
	};
}

function toFriendship(id: string, raw: Record<string, unknown>): Friendship | null {
	const members = raw.members as string[] | undefined;
	if (!Array.isArray(members) || members.length !== 2) return null;
	return {
		id,
		members: [members[0], members[1]],
		requestedBy: String(raw.requestedBy ?? ""),
		status: raw.status === "accepted" ? "accepted" : "pending",
		from: toPerson(raw.from, members[0]),
		to: toPerson(raw.to, members[1]),
		createdAt: (raw.createdAt as Timestamp | undefined) ?? null,
		acceptedAt: (raw.acceptedAt as Timestamp | undefined) ?? null,
	};
}

// --------------------------------------------------------------------------
// MÓJ PROFIL I KOD
// --------------------------------------------------------------------------
// Pełny zapis profilu (merge) — jeden zapis na zmianę statystyk
// Bez znajomych publikujemy tylko „wizytówkę” (bez pól stats/todayHabits)
export type ProfileWrite = Omit<PublicProfile, "updatedAt" | "stats" | "todayHabits"> &
	Partial<Pick<PublicProfile, "stats" | "todayHabits">>;

export async function saveProfile(uid: string, profile: ProfileWrite): Promise<void> {
	await setDoc(profileRef(uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

// Nowy, unikalny kod. Transakcja sprawdza, czy kod jest wolny.
export async function createFriendCode(uid: string, person: PersonSnapshot): Promise<string> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const code = randomCode();
		const created = await runTransaction(db, async (tx) => {
			const snap = await tx.get(codeRef(code));
			if (snap.exists()) return false;
			tx.set(codeRef(code), { uid, ...person, createdAt: serverTimestamp() });
			return true;
		});
		if (created) return code;
	}
	throw new Error("Could not allocate a friend code");
}

export async function updateFriendCode(code: string, person: PersonSnapshot): Promise<void> {
	await updateDoc(codeRef(code), { name: person.name, avatar: person.avatar });
}

export async function lookupFriendCode(code: string): Promise<CodeCard | null> {
	const snap = await getDoc(codeRef(code));
	if (!snap.exists()) return null;
	const data = snap.data() as Record<string, unknown>;
	if (typeof data.uid !== "string") return null;
	return { uid: data.uid, code, ...toPerson(data, data.uid) };
}

// --------------------------------------------------------------------------
// ZNAJOMOŚCI
// --------------------------------------------------------------------------
export function watchFriendships(
	uid: string,
	onNext: (list: Friendship[], fromCache: boolean) => void,
	onError: (err: Error) => void,
): Unsubscribe {
	const q = query(friendshipsRef, where("members", "array-contains", uid));
	return onSnapshot(
		q,
		(snap) =>
			onNext(
				snap.docs
					.map((d) => toFriendship(d.id, d.data()))
					.filter((f): f is Friendship => f !== null),
				snap.metadata.fromCache,
			),
		onError,
	);
}

export function watchProfile(
	uid: string,
	onNext: (profile: PublicProfile | null) => void,
	onError: (err: Error) => void,
): Unsubscribe {
	return onSnapshot(profileRef(uid), (snap) => onNext(toProfile(uid, snap.data())), onError);
}

// Czy mamy jakąkolwiek znajomość (1 odczyt) — tylko gdy na tym urządzeniu
// jeszcze tego nie wiemy; decyduje, czy w ogóle publikować statystyki
export async function hasAnyFriendship(uid: string): Promise<boolean> {
	const snap = await getDocs(
		query(friendshipsRef, where("members", "array-contains", uid), limit(1)),
	);
	return !snap.empty;
}

export async function fetchFriendship(pairId: string): Promise<Friendship | null> {
	const snap = await getDoc(friendshipRef(pairId));
	return snap.exists() ? toFriendship(snap.id, snap.data()) : null;
}

// Zaproszenie + powiadomienie w skrzynce adresata (atomowo)
export async function sendFriendRequest(
	me: string,
	other: string,
	from: PersonSnapshot,
	to: PersonSnapshot,
): Promise<void> {
	const members = [me, other].sort();
	const batch = writeBatch(db);
	batch.set(friendshipRef(pairIdOf(me, other)), {
		members,
		requestedBy: me,
		status: "pending",
		createdAt: serverTimestamp(),
		from,
		to,
	});
	batch.set(cheerRef(other, me), {
		from: me,
		kind: "request",
		name: from.name,
		at: serverTimestamp(),
	});
	await batch.commit();
}

export async function acceptFriendRequest(me: string, other: string, myName: string) {
	const batch = writeBatch(db);
	batch.update(friendshipRef(pairIdOf(me, other)), {
		status: "accepted",
		acceptedAt: serverTimestamp(),
	});
	batch.set(cheerRef(other, me), {
		from: me,
		kind: "accept",
		name: myName,
		at: serverTimestamp(),
	});
	await batch.commit();
}

// Odrzucenie, anulowanie i usunięcie znajomego — razem z naszym wpisem
// w jego skrzynce (żeby nie dostał nieaktualnego powiadomienia)
export async function removeFriendship(me: string, other: string) {
	const batch = writeBatch(db);
	batch.delete(friendshipRef(pairIdOf(me, other)));
	batch.delete(cheerRef(other, me));
	await batch.commit();
}

export async function sendCheer(me: string, other: string, myName: string) {
	await setDoc(cheerRef(other, me), {
		from: me,
		kind: "cheer",
		name: myName,
		at: serverTimestamp(),
	});
}

// --------------------------------------------------------------------------
// SKRZYNKA
// --------------------------------------------------------------------------
function toCheer(id: string, raw: Record<string, unknown>): Cheer {
	const kind = raw.kind === "request" || raw.kind === "accept" ? raw.kind : "cheer";
	const at = raw.at as Timestamp | null | undefined;
	return {
		id,
		from: typeof raw.from === "string" ? raw.from : id,
		kind,
		name: typeof raw.name === "string" && raw.name ? raw.name.slice(0, 40) : "A friend",
		at: typeof at?.toMillis === "function" ? at.toMillis() : 0,
	};
}

export async function fetchInbox(uid: string): Promise<Cheer[]> {
	const snap = await getDocs(cheersRef(uid));
	return snap.docs.map((d) => toCheer(d.id, d.data()));
}

export function watchInbox(
	uid: string,
	onNext: (list: Cheer[]) => void,
	onError: (err: Error) => void,
): Unsubscribe {
	return onSnapshot(
		cheersRef(uid),
		(snap) => onNext(snap.docs.map((d) => toCheer(d.id, d.data()))),
		onError,
	);
}

export async function clearInbox(uid: string, ids: string[]) {
	if (ids.length === 0) return;
	const batch = writeBatch(db);
	for (const id of ids) batch.delete(cheerRef(uid, id));
	await batch.commit();
}

// --------------------------------------------------------------------------
// USUWANIE KONTA (RODO): profil, kod, skrzynka, znajomości i nasze wpisy
// w skrzynkach znajomych
// --------------------------------------------------------------------------
export async function deleteSocialData(uid: string, friendCode?: string | null) {
	const [friendships, inbox] = await Promise.all([
		getDocs(query(friendshipsRef, where("members", "array-contains", uid))),
		getDocs(cheersRef(uid)),
	]);
	const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
	for (const f of friendships.docs) {
		const members = (f.data().members as string[]) ?? [];
		const other = members.find((m) => m !== uid);
		if (other) ops.push((b) => b.delete(cheerRef(other, uid)));
		ops.push((b) => b.delete(f.ref));
	}
	for (const c of inbox.docs) ops.push((b) => b.delete(c.ref));
	ops.push((b) => b.delete(profileRef(uid)));

	for (let i = 0; i < ops.length; i += 450) {
		const batch = writeBatch(db);
		ops.slice(i, i + 450).forEach((op) => op(batch));
		await batch.commit();
	}
	if (friendCode) {
		await deleteDoc(codeRef(friendCode)).catch((err) => {
			// Kod mógł już nie istnieć — nie blokujemy usuwania konta
			console.warn("Friend code delete failed", err);
		});
	}
}
