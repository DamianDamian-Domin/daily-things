import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
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
import { auth, db } from "@/firebase";
import { toDateKey } from "@/utils/timeUtils";

export const useAuthStore = defineStore("auth", () => {
	// ==========================================
	// 1. STANY (State)
	// ==========================================
	const user = ref<User | null>(null);
	const loading = ref(true);
	const error = ref<string | null>(null); // Przydatne do rzucania błędami w UI
	const isAuthDialogOpen = ref(false);
	const isGuestInfoModalOpen = ref(false);
	const showGuestNotification = ref(
		localStorage.getItem("guestNotification") === "true",
	);

	// Automatycznie zapisujemy do localStorage lub CZYŚCIMY, gdy flaga zgaśnie
	watch(showGuestNotification, (newValue) => {
		if (newValue) {
			localStorage.setItem("guestNotification", "true");
		} else {
			// Gdy użytkownik się zaloguje/zarejestruje i flaga zmieni się na false,
			// fizycznie usuwamy ślad z przeglądarki!
			localStorage.removeItem("guestNotification");
		}
	});

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
	// isGuestExpired też staje się funkcją
	const isGuestExpired = computed(() => {
		return guestDaysRemaining.value <= 6;
		// return guestDaysRemaining.value === 0;
	});

	// Zwraca ilość dni jako zwykła funkcja, aby czas zawsze był "świeży"
	const guestDaysRemaining = computed(() => {
		if (
			!user.value ||
			!user.value.isAnonymous ||
			!user.value.metadata.creationTime
		) {
			return 7;
		}

		const creationKey = toDateKey(new Date(user.value.metadata.creationTime));
		// Używamy po prostu zwykłego now Date() - bez żadnych triggerów
		const todayKey = toDateKey(new Date());

		const creationTime = new Date(creationKey).getTime();
		const todayTime = new Date(todayKey).getTime();

		const daysSinceCreation = Math.round(
			(todayTime - creationTime) / (1000 * 60 * 60 * 24),
		);
		const remaining = 7 - daysSinceCreation;

		return remaining > 0 ? remaining : 0;
	});

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
			showGuestNotification.value = false;
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
				showGuestNotification.value = false;
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
				showGuestNotification.value = false;
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
		isAuthDialogOpen,
		showGuestNotification,
		guestDaysRemaining,
		isGuestInfoModalOpen,
	};
});
