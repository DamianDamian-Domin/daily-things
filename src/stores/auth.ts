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
	setPersistence,
	inMemoryPersistence,
	browserLocalPersistence,
	User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { isWebPlatform } from "@/utils/platform";

export const useAuthStore = defineStore("auth", () => {
	// ==========================================
	// 1. STANY (State)
	// ==========================================
	const user = ref<User | null>(null);
	const loading = ref(true);
	const error = ref<string | null>(null);
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
			localStorage.removeItem("guestNotification");
		}
	});

	// ==========================================
	// 2. GETTERY (Computed)
	// ==========================================

	const isAuthenticated = computed(() => user.value !== null);
	const userUid = computed(() => user.value?.uid || null);
	const isGuest = computed(() => user.value?.isAnonymous ?? false);

	// ==========================================
	// POMOCNICZE: Blokowanie wyjścia dla Gościa (Web)
	// ==========================================

	// Ta funkcja wywoła systemowy dialog "Czy na pewno chcesz opuścić stronę?"
	const handleBeforeUnload = (e: BeforeUnloadEvent) => {
		if (isWebPlatform && isGuest.value) {
			e.preventDefault();
			e.returnValue = ""; // Wymagane przez większość nowoczesnych przeglądarek
		}
	};

	const setupUnloadListener = () => {
		if (isWebPlatform) {
			window.addEventListener("beforeunload", handleBeforeUnload);
		}
	};

	const removeUnloadListener = () => {
		if (isWebPlatform) {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		}
	};

	// Obserwator: Zakładamy lub zdejmujemy listener w zależności od statusu gościa
	watch(isGuest, (nowyStatusGoscia) => {
		if (nowyStatusGoscia) {
			setupUnloadListener();
		} else {
			removeUnloadListener();
		}
	});

	// ==========================================
	// 3. AKCJE (Actions)
	// ==========================================

	const initAuth = () => {
		return new Promise<void>((resolve) => {
			onAuthStateChanged(auth, (currentUser) => {
				user.value = currentUser;
				userUid.value = currentUser ? currentUser.uid : null;
				loading.value = false;

				// Jeśli startujemy apkę i ktoś ma od razu flagę isGuest, odpal nasłuchiwacz
				if (currentUser?.isAnonymous && isWebPlatform) {
					setupUnloadListener();
				}

				resolve();
			});
		});
	};

	// --- LOGOWANIE JAKO GOŚĆ ---
	const loginAsGuest = async () => {
		error.value = null;
		try {
			// 1. Zmieniamy persystencję NA CHWILĘ na sesyjną (tylko na Webie)
			if (isWebPlatform) {
				await setPersistence(auth, inMemoryPersistence);
			}

			const userCredential = await signInAnonymously(auth);
			const uid = userCredential.user.uid;

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
			// Przywracamy domyślną "trwałą" persystencję przed zalogowaniem na konto stałe
			if (isWebPlatform) {
				await setPersistence(auth, browserLocalPersistence);
			}
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
			if (user.value && user.value.isAnonymous) {
				const credential = EmailAuthProvider.credential(email, password);

				// Przed zlinkowaniem kont, przywracamy trwałą sesję, żeby nie wylogowało nowo zarejestrowanego usera po wyjściu z przeglądarki
				if (isWebPlatform) {
					await setPersistence(auth, browserLocalPersistence);
				}

				await linkWithCredential(user.value, credential);

				await setDoc(
					doc(db, "users", user.value.uid),
					{
						isAnonymous: false,
						email: email,
					},
					{ merge: true },
				);
				showGuestNotification.value = false;
			} else {
				// Zwykła rejestracja
				if (isWebPlatform) {
					await setPersistence(auth, browserLocalPersistence);
				}
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
			removeUnloadListener(); // Dla pewności czyszczę
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
		initAuth,
		login,
		register,
		logout,
		loginAsGuest,
		isAuthDialogOpen,
		showGuestNotification,
		isGuestInfoModalOpen,
	};
});
