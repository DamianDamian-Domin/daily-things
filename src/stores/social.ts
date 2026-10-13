import type { useFriendsStore } from "@/stores/friends";

// ==========================================================================
// Leniwe ładowanie funkcji „Znajomi” — goście i osoby, które nie zaglądają
// na kartę Znajomi, nie pobierają tego kodu (ani zapytań do Firestore).
// ==========================================================================

export const INVITE_KEY = "dt-invite";

type FriendsStore = ReturnType<typeof useFriendsStore>;

let friendsPromise: Promise<FriendsStore> | null = null;
let friendsStore: FriendsStore | null = null;
let syncPromise: Promise<unknown> | null = null;

export function loadFriends(): Promise<FriendsStore> {
	friendsPromise ??= import("@/stores/friends").then((m) => {
		friendsStore = m.useFriendsStore();
		return friendsStore;
	});
	return friendsPromise;
}

// Magazyn znajomych, jeśli już jest wczytany (np. do sprzątania przy wylogowaniu)
export function peekFriends(): FriendsStore | null {
	return friendsStore;
}

// Publikacja profilu działa sama po utworzeniu magazynu (watchery)
export function loadProfileSync(): Promise<unknown> {
	syncPromise ??= import("@/stores/profileSync").then((m) => m.useProfileSyncStore());
	return syncPromise;
}

export function hasStoredInvite(): boolean {
	try {
		return Boolean(sessionStorage.getItem(INVITE_KEY));
	} catch {
		return false;
	}
}
