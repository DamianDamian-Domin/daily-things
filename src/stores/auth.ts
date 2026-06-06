import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	signInAnonymously,
	onAuthStateChanged,
	linkWithCredential,
	EmailAuthProvider,
	User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase"; // Upewnij się, że ścieżka do Twojego pliku configu jest poprawna

export const useAuthStore = defineStore("auth", () => {
	// ==========================================
	// 1. STANY (State)
	// ==========================================
	const user = ref<User | null>(null);
	const loading = ref(true);
	const error = ref<string | null>(null); // Przydatne do rzucania błędami w UI

	// ==========================================
	// 2. GETTERY (Computed)
	// ==========================================

	// Czy ktokolwiek jest zalogowany (gość lub normalny user)
	const isAuthenticated = computed(() => user.value !== null);

	// Zwraca samo UID użytkownika (naprawia błąd w habbits.ts i todos.ts)
	const userUid = computed(() => user.value?.uid || null);

	// Czy to jest konto anonimowe (gość)
	const isGuest = computed(() => user.value?.isAnonymous ?? false);

	// Sprawdzamy czy minęło 7 dni dla gościa
	const isGuestExpired = computed(() => {
		if (
			!user.value ||
			!user.value.isAnonymous ||
			!user.value.metadata.creationTime
		)
			return false;

		const creationTime = new Date(user.value.metadata.creationTime).getTime();
		const now = Date.now();
		const daysSinceCreation = (now - creationTime) / (1000 * 60 * 60 * 24);

		return daysSinceCreation >= 7;
	});

	// const isGuestExpired = computed(() => {
	// 	// Zamiast zwracać "null", jeśli nie ma usera, twardo zwracamy false
	// 	if (!user.value || !user.value.isAnonymous) {
	// 		return false;
	// 	}

	// 	// Jeśli dotarliśmy tutaj, to user istnieje i jest gościem
	// 	return true;
	// });

	// ==========================================
	// 3. AKCJE (Actions)
	// ==========================================

	// Nasłuchiwanie na zmiany stanu logowania (odpalasz to np. w App.vue)
	const initAuth = () => {
		return new Promise<void>((resolve) => {
			onAuthStateChanged(auth, (currentUser) => {
				user.value = currentUser;
				userUid.value = currentUser ? currentUser.uid : null; // <--- TWARDE PRZYPISANIE
				loading.value = false;
				resolve();
			});
		});
	};

	// --- LOGOWANIE JAKO GOŚĆ ---
	const loginAsGuest = async () => {
		error.value = null;
		try {
			const userCredential = await signInAnonymously(auth);
			const uid = userCredential.user.uid;

			// Tworzymy dokument usera w bazie z datą startu (potrzebne do reguł 7 dni)
			await setDoc(
				doc(db, "users", uid),
				{
					isAnonymous: true,
					createdAt: serverTimestamp(),
				},
				{ merge: true },
			);
		} catch (err: any) {
			error.value = err.message;
			console.error("Błąd przy logowaniu gościa:", err);
			throw err;
		}
	};

	// --- STANDARDOWE LOGOWANIE MAILEM ---
	const login = async (email: string, password: string) => {
		error.value = null;
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (err: any) {
			error.value = err.message;
			throw err;
		}
	};

	// --- REJESTRACJA (Z MIGRACJĄ KONTA GOŚCIA) ---
	const register = async (email: string, password: string) => {
		error.value = null;
		try {
			// Jeśli użytkownik obecnie jest gościem, podpinamy mu maila do jego obecnego UID
			if (user.value && user.value.isAnonymous) {
				const credential = EmailAuthProvider.credential(email, password);
				await linkWithCredential(user.value, credential);

				// Aktualizujemy w bazie, że to już jest pełnoprawny user
				await setDoc(
					doc(db, "users", user.value.uid),
					{
						isAnonymous: false,
						email: email,
						// Jeśli masz inne pola typu imię, dodaj je tutaj
					},
					{ merge: true },
				);
			} else {
				// Zwykła rejestracja (jeśli ktoś po prostu zakłada konto z wylogowanego ekranu)
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password,
				);
				await setDoc(
					doc(db, "users", userCredential.user.uid),
					{
						isAnonymous: false,
						email: email,
						createdAt: serverTimestamp(),
					},
					{ merge: true },
				);
			}
		} catch (err: any) {
			error.value = err.message;
			throw err;
		}
	};

	// --- WYLOGOWANIE ---
	const logout = async () => {
		error.value = null;
		try {
			await signOut(auth);
		} catch (err: any) {
			error.value = err.message;
			throw err;
		}
	};

	return {
		user,
		userUid,
		loading,
		error,
		isAuthenticated,
		isGuest,
		isGuestExpired,
		initAuth,
		login,
		register,
		logout,
		loginAsGuest,
	};
});
