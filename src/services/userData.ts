import {
	arrayUnion,
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDoc,
	getDocs,
	query,
	type QuerySnapshot,
	setDoc,
	where,
	writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import type {
	DayEntry,
	Goal,
	GoalRef,
	Habit,
	HabitLog,
	HabitReminder,
	TodoItem,
	UserPreferences,
} from "@/libs/types";
import type { AvatarConfig } from "@/utils/avatar";
import { plain } from "@/utils/plain";

// ==========================================================================
// Model danych:
//   users/{uid}                     → profil, dailyGoals[], recentlyUsed[],
//                                      customHabbits[], reminders[], preferences{}
//   users/{uid}/habbits/{YYYY-MM-DD} → { date, habbits[], goalsSnapshot[] }
//   users/{uid}/todos/{todoId}       → TodoItem (z podzadaniami w środku)
// Funkcje „Znajomi” (profiles, friendCodes, friendships) → services/friends.ts
// ==========================================================================

export interface UserDoc {
	isAnonymous?: boolean;
	email?: string;
	createdAt?: unknown;
	// Stary format: wszystkie zadania w jednej tablicy. Przenoszone do
	// users/{uid}/todos przy pierwszym wczytaniu (migrateLegacyTodos).
	todos?: unknown[];
	dailyGoals?: Goal[];
	recentlyUsed?: string[];
	// Klucz w Firestore zostaje ze starą pisownią (zob. DAY_LOGS_FIELD)
	customHabbits?: Habit[];
	preferences?: Partial<UserPreferences>;
	// Godziny przypomnień o celach (powiadomienia planuje urządzenie)
	reminders?: HabitReminder[];
	// Własny awatar (brak = domyślny wyliczony z UID) i kod znajomego
	avatar?: AvatarConfig;
	friendCode?: string;
	// Zdobyte odznaki: id → kiedy (ms)
	achievements?: Record<string, number>;
}

export const userDocRef = (uid: string) => doc(db, "users", uid);
// Klucze w Firestore zostają ze starą pisownią „habbits” — zmiana wymagałaby
// migracji wszystkich zapisanych danych. W kodzie dzień ma pole `habits`.
const DAYS_COLLECTION = "habbits";
export const DAY_LOGS_FIELD = "habbits";

// Dokument dnia tak, jak leży w Firestore
interface StoredDay {
	date?: string;
	habbits?: HabitLog[];
	goalsSnapshot?: GoalRef[];
}

function toDayEntry(id: string, data: StoredDay): DayEntry {
	return {
		date: data.date ?? id,
		habits: Array.isArray(data.habbits) ? data.habbits : [],
		goalsSnapshot: Array.isArray(data.goalsSnapshot) ? data.goalsSnapshot : undefined,
	};
}

export const daysCollectionRef = (uid: string) => collection(db, "users", uid, DAYS_COLLECTION);
export const dayDocRef = (uid: string, dateKey: string) =>
	doc(db, "users", uid, DAYS_COLLECTION, dateKey);
export const todosCollectionRef = (uid: string) => collection(db, "users", uid, "todos");
export const todoDocRef = (uid: string, todoId: string) => doc(db, "users", uid, "todos", todoId);

// Batch Firestore ma limit 500 operacji — zostawiamy zapas
const BATCH_LIMIT = 450;

async function inBatches<T>(items: T[], apply: (batch: ReturnType<typeof writeBatch>, item: T) => void) {
	for (let i = 0; i < items.length; i += BATCH_LIMIT) {
		const batch = writeBatch(db);
		items.slice(i, i + BATCH_LIMIT).forEach((item) => apply(batch, item));
		await batch.commit();
	}
}

async function deleteAll(snap: QuerySnapshot) {
	await inBatches(snap.docs, (batch, d) => batch.delete(d.ref));
}

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
	return snap.docs.map((d) => toDayEntry(d.id, d.data() as StoredDay));
}

// ==========================================================================
// Zadania — jeden dokument na zadanie, więc zmiana jednego nie wysyła
// całej listy, a dokument użytkownika nie rośnie w nieskończoność (limit 1 MB)
// ==========================================================================
export async function fetchTodos(uid: string): Promise<TodoItem[]> {
	const snap = await getDocs(todosCollectionRef(uid));
	return snap.docs.map((d) => ({ ...(d.data() as TodoItem), id: d.id }));
}

export async function saveTodo(uid: string, todo: TodoItem) {
	await setDoc(todoDocRef(uid, todo.id), plain(todo));
}

export async function saveTodos(uid: string, todos: TodoItem[]) {
	await inBatches(todos, (batch, todo) => batch.set(todoDocRef(uid, todo.id), plain(todo)));
}

export async function deleteTodos(uid: string, ids: string[]) {
	await inBatches(ids, (batch, id) => batch.delete(todoDocRef(uid, id)));
}

// Stara tablica users/{uid}.todos → lista zadań. Jeszcze starszy format
// grupował zadania po datach ({ date, todos[] }) — spłaszczamy go.
export function normalizeLegacyTodos(raw: unknown): TodoItem[] {
	if (!Array.isArray(raw)) return [];
	const flat = raw.flatMap((entry) =>
		entry && typeof entry === "object" && "date" in entry && Array.isArray((entry as { todos?: unknown }).todos)
			? ((entry as { todos: unknown[] }).todos)
			: [entry],
	);
	return flat
		.filter((t): t is TodoItem => !!t && typeof t === "object" && typeof (t as TodoItem).id === "string")
		.map((t) => ({ ...t, text: typeof t.text === "string" ? t.text : "", completed: !!t.completed }));
}

// Jednorazowe przeniesienie: najpierw zapis dokumentów, na końcu usunięcie
// tablicy. Gdy coś się nie uda, tablica zostaje i próba powtórzy się przy
// następnym wczytaniu (zapis po id jest idempotentny).
export async function migrateLegacyTodos(uid: string, todos: TodoItem[]) {
	await saveTodos(uid, todos);
	await setDoc(userDocRef(uid), { todos: deleteField() }, { merge: true });
}

async function fetchAllDays(uid: string): Promise<DayEntry[]> {
	const snap = await getDocs(daysCollectionRef(uid));
	return snap.docs.map((d) => toDayEntry(d.id, d.data() as StoredDay));
}

// ==========================================================================
// Przenoszenie danych gościa na istniejące konto
// ==========================================================================
export interface ExportedUserData {
	user: UserDoc;
	days: DayEntry[];
	todos: TodoItem[];
}

// Zadania z kolekcji + te, które jeszcze siedzą w starej tablicy
async function fetchAllTodos(uid: string, user: UserDoc): Promise<TodoItem[]> {
	const todos = await fetchTodos(uid);
	const ids = new Set(todos.map((t) => t.id));
	return [...todos, ...normalizeLegacyTodos(user.todos).filter((t) => !ids.has(t.id))];
}

export async function exportUserData(uid: string): Promise<ExportedUserData> {
	const [user, days] = await Promise.all([fetchUserDoc(uid), fetchAllDays(uid)]);
	const todos = await fetchAllTodos(uid, user);
	return { user, days, todos };
}

export function hasMeaningfulData(data: ExportedUserData): boolean {
	return (
		data.days.some((d) => (d.habits?.length ?? 0) > 0) ||
		data.todos.length > 0 ||
		(data.user.dailyGoals?.length ?? 0) > 0
	);
}

// Scalanie jest addytywne: nic z istniejącego konta nie ginie.
export async function mergeUserData(targetUid: string, source: ExportedUserData) {
	const target = await fetchUserDoc(targetUid);

	const existingTodoIds = new Set((await fetchAllTodos(targetUid, target)).map((t) => t.id));
	await saveTodos(
		targetUid,
		source.todos.filter((t) => !existingTodoIds.has(t.id)),
	);
	const dailyGoals = target.dailyGoals?.length ? target.dailyGoals : source.user.dailyGoals ?? [];
	const recentlyUsed = [
		...new Set([...(source.user.recentlyUsed ?? []), ...(target.recentlyUsed ?? [])]),
	].slice(0, 12);
	const customNames = new Set((target.customHabbits ?? []).map((h) => h.name));
	const customHabits = [
		...(target.customHabbits ?? []),
		...(source.user.customHabbits ?? []).filter((h) => !customNames.has(h.name)),
	];

	await saveUserFields(targetUid, {
		dailyGoals,
		recentlyUsed,
		customHabbits: customHabits,
		...(!target.reminders?.length && source.user.reminders?.length
			? { reminders: source.user.reminders }
			: {}),
		...(!target.avatar && source.user.avatar ? { avatar: source.user.avatar } : {}),
	});

	for (const day of source.days) {
		if (!day.habits?.length) continue;
		const ref = dayDocRef(targetUid, day.date);
		const existing = await getDoc(ref);
		await setDoc(
			ref,
			{
				date: day.date,
				[DAY_LOGS_FIELD]: arrayUnion(...day.habits),
				...(existing.exists() || !day.goalsSnapshot ? {} : { goalsSnapshot: day.goalsSnapshot }),
			},
			{ merge: true },
		);
	}
}

// RODO / Google Play: pełne usunięcie danych użytkownika — również profilu
// dla znajomych, kodu, znajomości i powiadomień
export async function deleteAllUserData(uid: string) {
	const userDoc = await fetchUserDoc(uid);
	// Moduł znajomych ładujemy dopiero tutaj (rzadka operacja)
	const { deleteSocialData } = await import("@/services/friends");
	await deleteSocialData(uid, userDoc.friendCode);
	await deleteAll(await getDocs(daysCollectionRef(uid)));
	await deleteAll(await getDocs(todosCollectionRef(uid)));
	await deleteDoc(userDocRef(uid));
}
