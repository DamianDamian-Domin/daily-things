import {
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDocs,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where,
	type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { PersonSnapshot } from "@/services/friends";
import { toChallenge, type Challenge } from "@/utils/challenges";
import type { DateKey } from "@/utils/date";
import type { PaletteKey } from "@/utils/pixelIcons";

// ==========================================================================
// Wyzwania ze znajomymi: challenges/{id}
//   { title, icon, palette, days, start, createdBy, createdAt,
//     members[] (zaproszeni), joined[] (dołączyli),
//     people{uid: {name, avatar}}, checkins{uid: [YYYY-MM-DD]} }
// Każdy uczestnik zmienia wyłącznie własne wpisy — szczegóły w firestore.rules
// ==========================================================================

const challengesRef = collection(db, "challenges");
const challengeRef = (id: string) => doc(db, "challenges", id);

export interface NewChallenge {
	title: string;
	icon: string;
	palette: PaletteKey;
	days: number;
	start: DateKey;
}

export function watchChallenges(
	uid: string,
	onNext: (list: Challenge[]) => void,
	onError: (err: Error) => void,
): Unsubscribe {
	const q = query(challengesRef, where("members", "array-contains", uid));
	return onSnapshot(
		q,
		(snap) =>
			onNext(
				snap.docs
					.map((d) => toChallenge(d.id, d.data()))
					.filter((c): c is Challenge => c !== null),
			),
		onError,
	);
}

export async function createChallenge(
	me: string,
	input: NewChallenge,
	people: Record<string, PersonSnapshot>,
): Promise<string> {
	const members = [me, ...Object.keys(people).filter((uid) => uid !== me)];
	const ref = await addDoc(challengesRef, {
		...input,
		createdBy: me,
		createdAt: serverTimestamp(),
		members,
		joined: [me],
		people,
		checkins: {},
	});
	return ref.id;
}

export async function joinChallenge(id: string, me: string): Promise<void> {
	await updateDoc(challengeRef(id), { joined: arrayUnion(me) });
}

// Odrzucenie zaproszenia i wyjście z wyzwania: znikają wszystkie moje wpisy
export async function leaveChallenge(c: Challenge, me: string): Promise<void> {
	if (c.members.length === 1 && c.members[0] === me) {
		await deleteDoc(challengeRef(c.id));
		return;
	}
	await updateDoc(challengeRef(c.id), {
		members: arrayRemove(me),
		joined: arrayRemove(me),
		[`people.${me}`]: deleteField(),
		[`checkins.${me}`]: deleteField(),
	});
}

export async function setCheckin(id: string, me: string, day: DateKey, done: boolean) {
	await updateDoc(challengeRef(id), {
		[`checkins.${me}`]: done ? arrayUnion(day) : arrayRemove(day),
	});
}

// Usuwanie konta (RODO): wychodzimy ze wszystkich wyzwań
export async function leaveAllChallenges(me: string): Promise<void> {
	const snap = await getDocs(query(challengesRef, where("members", "array-contains", me)));
	for (const d of snap.docs) {
		const c = toChallenge(d.id, d.data());
		if (c) await leaveChallenge(c, me);
		else await deleteDoc(d.ref).catch(() => undefined);
	}
}
