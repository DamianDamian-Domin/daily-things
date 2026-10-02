import {
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	where,
	writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { DayEntry, Goal, Habbit, TodoItem, UserPreferences } from "@/libs/types";

// ==========================================================================
// Model danych:
//   users/{uid}                     → profil, todos[], dailyGoals[], recentlyUsed[],
//                                      customHabbits[], preferences{}
//   users/{uid}/habbits/{YYYY-MM-DD} → { date, habbits[], goalsSnapshot[] }
// ==========================================================================

export interface UserDoc {
	isAnonymous?: boolean;
	email?: string;
	createdAt?: unknown;
	todos?: TodoItem[];
	dailyGoals?: Goal[];
	recentlyUsed?: string[];
	customHabbits?: Habbit[];
	preferences?: Partial<UserPreferences>;
}

export const userDocRef = (uid: string) => doc(db, "users", uid);
export const daysCollectionRef = (uid: string) => collection(db, "users", uid, "habbits");
export const dayDocRef = (uid: string, dateKey: string) =>
	doc(db, "users", uid, "habbits", dateKey);

// Jeden odczyt dokumentu użytkownika na sesję zamiast kilku (todos, cele,
// ostatnie, preferencje czytały go wcześniej osobno — 4-5 odczytów).
export async function fetchUserDoc(uid: string): Promise<UserDoc> {
	const snap = await getDoc(userDocRef(uid));
	return snap.exists() ? (snap.data() as UserDoc) : {};
}

export async function saveUserFields(uid: string, fields: Partial<UserDoc>) {
	await setDoc(userDocRef(uid), fields, { merge: true });
}

export async function fetchDays(uid: string, startKey: string, endKey: string): Promise<DayEntry[]> {
	const q = query(
		daysCollectionRef(uid),
		where("date", ">=", startKey),
		where("date", "<=", endKey),
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => {
		const data = d.data() as Partial<DayEntry>;
		return {
			date: data.date ?? d.id,
			habbits: Array.isArray(data.habbits) ? data.habbits : [],
			goalsSnapshot: Array.isArray(data.goalsSnapshot) ? data.goalsSnapshot : undefined,
		};
	});
}

async function fetchAllDays(uid: string): Promise<DayEntry[]> {
	const snap = await getDocs(daysCollectionRef(uid));
	return snap.docs.map((d) => ({ date: d.id, ...(d.data() as Omit<DayEntry, "date">) }));
}

// ==========================================================================
// Przenoszenie danych gościa na istniejące konto
// ==========================================================================
export interface ExportedUserData {
	user: UserDoc;
	days: DayEntry[];
}

export async function exportUserData(uid: string): Promise<ExportedUserData> {
	const [user, days] = await Promise.all([fetchUserDoc(uid), fetchAllDays(uid)]);
	return { user, days };
}

export function hasMeaningfulData(data: ExportedUserData): boolean {
	return (
		data.days.some((d) => (d.habbits?.length ?? 0) > 0) ||
		(data.user.todos?.length ?? 0) > 0 ||
		(data.user.dailyGoals?.length ?? 0) > 0
	);
}

// Scalanie jest addytywne: nic z istniejącego konta nie ginie.
export async function mergeUserData(targetUid: string, source: ExportedUserData) {
	const target = await fetchUserDoc(targetUid);

	const existingTodoIds = new Set((target.todos ?? []).map((t) => t.id));
	const todos = [
		...(target.todos ?? []),
		...(source.user.todos ?? []).filter((t) => !existingTodoIds.has(t.id)),
	];
	const dailyGoals = target.dailyGoals?.length ? target.dailyGoals : source.user.dailyGoals ?? [];
	const recentlyUsed = [
		...new Set([...(source.user.recentlyUsed ?? []), ...(target.recentlyUsed ?? [])]),
	].slice(0, 12);
	const customNames = new Set((target.customHabbits ?? []).map((h) => h.name));
	const customHabbits = [
		...(target.customHabbits ?? []),
		...(source.user.customHabbits ?? []).filter((h) => !customNames.has(h.name)),
	];

	await saveUserFields(targetUid, { todos, dailyGoals, recentlyUsed, customHabbits });

	for (const day of source.days) {
		if (!day.habbits?.length) continue;
		const ref = dayDocRef(targetUid, day.date);
		const existing = await getDoc(ref);
		await setDoc(
			ref,
			{
				date: day.date,
				habbits: arrayUnion(...day.habbits),
				...(existing.exists() || !day.goalsSnapshot ? {} : { goalsSnapshot: day.goalsSnapshot }),
			},
			{ merge: true },
		);
	}
}

// RODO / Google Play: pełne usunięcie danych użytkownika
export async function deleteAllUserData(uid: string) {
	const days = await getDocs(daysCollectionRef(uid));
	let batch = writeBatch(db);
	let ops = 0;
	for (const d of days.docs) {
		batch.delete(d.ref);
		if (++ops === 450) {
			await batch.commit();
			batch = writeBatch(db);
			ops = 0;
		}
	}
	if (ops > 0) await batch.commit();
	await deleteDoc(userDocRef(uid));
}
