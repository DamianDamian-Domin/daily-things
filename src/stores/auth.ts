import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import {
	AuthCredential,
	EmailAuthProvider,
	GoogleAuthProvider,
	User,
	browserPopupRedirectResolver,
	createUserWithEmailAndPassword,
	deleteUser,
	linkWithCredential,
	linkWithPopup,
	onAuthStateChanged,
	reauthenticateWithCredential,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInAnonymously,
	signInWithCredential,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updatePassword,
	updateProfile,
} from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { auth } from "@/firebase";
import { isNativePlatform } from "@/utils/platform";
import {
	deleteAllUserData,
	exportUserData,
	hasMeaningfulData,
	mergeUserData,
	saveUserFields,
	type ExportedUserData,
} from "@/services/userData";
import { useToastStore } from "@/stores/toast";

export type AuthDialogMode = "welcome" | "login" | "register" | "reset";

// Przyjazne komunikaty zamiast surowych kodów Firebase
export function mapFirebaseError(code: string | undefined): string {
	switch (code) {
		case "auth/invalid-credential":
		case "auth/wrong-password":
		case "auth/user-not-found":
		case "auth/invalid-login-credentials":
			return "Wrong email or password.";
		case "auth/invalid-email":
			return "That email address doesn't look right.";
		case "auth/missing-email":
			return "Please enter your email address.";
		case "auth/missing-password":
			return "Please enter your password.";
		case "auth/email-already-in-use":
			return "This email already has an account — sign in instead.";
		case "auth/credential-already-in-use":
			return "This account is already connected to another profile.";
		case "auth/weak-password":
			return "Password is too weak — use at least 8 characters.";
		case "auth/too-many-requests":
			return "Too many attempts. Take a short break and try again.";
		case "auth/network-request-failed":
			return "No connection. Check your internet and try again.";
		case "auth/user-disabled":
			return "This account has been disabled.";
		case "auth/popup-blocked":
			return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
		case "auth/popup-closed-by-user":
		case "auth/cancelled-popup-request":
		case "auth/user-cancelled":
			return "";
		case "auth/unauthorized-domain":
			return "Google sign-in isn't enabled for this website yet.";
		case "auth/operation-not-allowed":
			return "This sign-in method is turned off for now.";
		case "auth/requires-recent-login":
			return "For your security, please sign in again and retry.";
		case "auth/provider-already-linked":
			return "This sign-in method is already connected.";
		default:
			return "Something went wrong. Please try again.";
	}
}

function errorCode(err: unknown): string | undefined {
	return (err as { code?: string })?.code;
}

export const useAuthStore = defineStore("auth", () => {
	const toast = useToastStore();

	// ==========================================
	// STAN
	// ==========================================
	const user = shallowRef<User | null>(null);
	// Firebase mutuje obiekt User w miejscu (np. updateProfile) — licznik
	// wymusza przeliczenie zależnych computed.
	const userVersion = ref(0);
	const loading = ref(true);
	const busy = ref(false);
	const error = ref<string | null>(null);
	const isAuthDialogOpen = ref(false);
	const authDialogMode = ref<AuthDialogMode>("welcome");
	// Zmienia się, gdy dane konta zostały zmienione „z boku” (np. scalenie
	// danych gościa) — App.vue wtedy przeładowuje stan.
	const dataRevision = ref(0);

	// ==========================================
	// GETTERY
	// ==========================================
	// Niemutowalny „snapshot” użytkownika — nowy obiekt przy każdej zmianie,
	// więc wszystkie zależne computed przeliczają się poprawnie.
	const current = computed(() => {
		userVersion.value;
		const u = user.value;
		if (!u) return null;
		return {
			uid: u.uid,
			isAnonymous: u.isAnonymous,
			email: u.email,
			emailVerified: u.emailVerified,
			displayName: u.displayName,
			photoURL: u.photoURL,
			providerData: u.providerData.map((p) => ({ providerId: p.providerId })),
			metadata: { creationTime: u.metadata.creationTime },
		};
	});
	const isAuthenticated = computed(() => current.value !== null);
	const userUid = computed(() => current.value?.uid ?? null);
	const isGuest = computed(() => current.value?.isAnonymous ?? false);
	const email = computed(() => current.value?.email ?? "");
	const emailVerified = computed(() => current.value?.emailVerified ?? false);
	const photoURL = computed(() => current.value?.photoURL ?? "");
	const providers = computed(
		() => current.value?.providerData.map((p) => p.providerId) ?? [],
	);
	const hasPasswordProvider = computed(() => providers.value.includes("password"));
	const hasGoogleProvider = computed(() => providers.value.includes("google.com"));
	const accountCreatedAt = computed(() => current.value?.metadata?.creationTime ?? null);
	const displayName = computed(() => {
		if (!current.value) return "";
		if (isGuest.value) return "Guest";
		return current.value.displayName || email.value.split("@")[0] || "Friend";
	});
	const firstName = computed(() =>
		isGuest.value ? "" : (current.value?.displayName || "").trim().split(/\s+/)[0] || "",
	);
	const initials = computed(() => {
		if (isGuest.value) return "G";
		const name = current.value?.displayName?.trim();
		if (name) {
			const parts = name.split(/\s+/);
			return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
		}
		return email.value.slice(0, 2).toUpperCase() || "?";
	});
	// Logowanie Google przez popup nie działa w WebView Capacitora
	const canUseGoogle = !isNativePlatform;

	function refreshUser() {
		user.value = auth.currentUser;
		userVersion.value++;
	}

	// ==========================================
	// START
	// ==========================================
	let initPromise: Promise<void> | null = null;
	function initAuth() {
		if (!initPromise) {
			initPromise = new Promise<void>((resolve) => {
				onAuthStateChanged(auth, (firebaseUser) => {
					user.value = firebaseUser;
					userVersion.value++;
					loading.value = false;
					resolve();
				});
			});
		}
		return initPromise;
	}

	function openAuthDialog(mode: AuthDialogMode = "welcome") {
		error.value = null;
		authDialogMode.value = mode;
		isAuthDialogOpen.value = true;
	}

	function closeAuthDialog() {
		isAuthDialogOpen.value = false;
		error.value = null;
	}

	async function run<T>(action: () => Promise<T>): Promise<T> {
		busy.value = true;
		error.value = null;
		try {
			return await action();
		} catch (err) {
			const message = mapFirebaseError(errorCode(err));
			error.value = message || null;
			throw err;
		} finally {
			busy.value = false;
		}
	}

	// ==========================================
	// GOŚĆ
	// ==========================================
	// Sesja gościa jest trwała (localStorage/IndexedDB) — odświeżenie strony
	// nie kasuje już postępów. Konto można później „ulepszyć” bez utraty danych.
	async function continueAsGuest() {
		if (user.value) return;
		await run(async () => {
			const cred = await signInAnonymously(auth);
			// Zapis w tle — Firestore i tak go zakolejkuje, UI nie musi czekać na serwer
			saveUserFields(cred.user.uid, { isAnonymous: true, createdAt: serverTimestamp() }).catch(
				(err) => console.warn("Guest profile save failed", err),
			);
		});
	}

	// Gość loguje się na ISTNIEJĄCE konto → przenosimy jego postępy.
	async function withGuestMigration(signIn: () => Promise<User>) {
		const guest = user.value?.isAnonymous ? user.value : null;
		let exported: ExportedUserData | null = null;
		if (guest) {
			try {
				exported = await exportUserData(guest.uid);
			} catch (err) {
				console.warn("Could not export guest data", err);
			}
		}

		const signedIn = await signIn();

		if (exported && hasMeaningfulData(exported)) {
			try {
				await mergeUserData(signedIn.uid, exported);
				dataRevision.value++;
				toast.show("Your guest progress moved to your account ✨", { tone: "success" });
			} catch (err) {
				console.error("Guest data merge failed", err);
				toast.error("We couldn't move your guest progress.");
			}
		}
		return signedIn;
	}

	// ==========================================
	// EMAIL + HASŁO
	// ==========================================
	async function login(emailAddr: string, password: string) {
		await run(() =>
			withGuestMigration(async () => {
				const cred = await signInWithEmailAndPassword(auth, emailAddr.trim(), password);
				return cred.user;
			}),
		);
		closeAuthDialog();
	}

	// Gość → podpinamy email do jego konta (to samo UID, zero migracji danych).
	async function register(emailAddr: string, password: string) {
		const trimmed = emailAddr.trim();
		const wasGuest = user.value?.isAnonymous ?? false;
		await run(async () => {
			let registered: User;
			if (wasGuest && user.value) {
				const credential = EmailAuthProvider.credential(trimmed, password);
				registered = (await linkWithCredential(user.value, credential)).user;
			} else {
				registered = (await createUserWithEmailAndPassword(auth, trimmed, password)).user;
			}
			saveUserFields(registered.uid, {
				isAnonymous: false,
				email: trimmed,
				...(wasGuest ? {} : { createdAt: serverTimestamp() }),
			}).catch((err) => console.warn("Profile save failed", err));
			// Weryfikacja nie blokuje korzystania z aplikacji
			sendEmailVerification(registered).catch((err) =>
				console.warn("Verification email failed", err),
			);
			refreshUser();
		});
	}

	async function resetPassword(emailAddr: string) {
		await run(() => sendPasswordResetEmail(auth, emailAddr.trim()));
	}

	async function resendVerificationEmail() {
		if (!auth.currentUser) return;
		await run(() => sendEmailVerification(auth.currentUser!));
	}

	async function reloadUser() {
		if (!auth.currentUser) return;
		await auth.currentUser.reload();
		refreshUser();
	}

	// ==========================================
	// GOOGLE
	// ==========================================
	async function loginWithGoogle() {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: "select_account" });

		await run(async () => {
			const guest = user.value?.isAnonymous ? user.value : null;
			if (guest) {
				try {
					// Gość → podpinamy Google do tego samego konta
					const linked = await linkWithPopup(guest, provider, browserPopupRedirectResolver);
					saveUserFields(linked.user.uid, {
						isAnonymous: false,
						email: linked.user.email ?? undefined,
					}).catch((e) => console.warn("Profile save failed", e));
					refreshUser();
					return;
				} catch (err) {
					// To konto Google już istnieje → logujemy się na nie i przenosimy dane
					if (errorCode(err) !== "auth/credential-already-in-use") throw err;
					const credential = GoogleAuthProvider.credentialFromError(err as never);
					if (!credential) throw err;
					await withGuestMigration(async () => signInWithCredentialUser(credential));
					return;
				}
			}

			const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
			saveUserFields(result.user.uid, {
				isAnonymous: false,
				email: result.user.email ?? undefined,
			}).catch((e) => console.warn("Profile save failed", e));
		});
		closeAuthDialog();
	}

	async function signInWithCredentialUser(credential: AuthCredential) {
		return (await signInWithCredential(auth, credential)).user;
	}

	// ==========================================
	// PROFIL
	// ==========================================
	async function updateDisplayName(name: string) {
		if (!auth.currentUser) throw new Error("No authenticated user");
		await updateProfile(auth.currentUser, { displayName: name.trim() });
		refreshUser();
	}

	async function changePassword(currentPassword: string, newPassword: string) {
		const current = auth.currentUser;
		if (!current?.email) throw new Error("No authenticated user");
		const credential = EmailAuthProvider.credential(current.email, currentPassword);
		await reauthenticateWithCredential(current, credential);
		await updatePassword(current, newPassword);
	}

	async function logout() {
		await signOut(auth);
		user.value = null;
		userVersion.value++;
	}

	// Usunięcie konta i wszystkich danych (wymóg RODO i Google Play)
	async function deleteAccount() {
		const current = auth.currentUser;
		if (!current) return;
		await deleteAllUserData(current.uid);
		await deleteUser(current);
		user.value = null;
		userVersion.value++;
	}

	return {
		// stan
		user: current,
		loading,
		busy,
		error,
		isAuthDialogOpen,
		authDialogMode,
		dataRevision,
		// gettery
		isAuthenticated,
		userUid,
		isGuest,
		email,
		emailVerified,
		photoURL,
		displayName,
		firstName,
		initials,
		hasPasswordProvider,
		hasGoogleProvider,
		accountCreatedAt,
		canUseGoogle,
		// akcje
		initAuth,
		openAuthDialog,
		closeAuthDialog,
		continueAsGuest,
		login,
		register,
		resetPassword,
		resendVerificationEmail,
		reloadUser,
		loginWithGoogle,
		updateDisplayName,
		changePassword,
		logout,
		deleteAccount,
		mapFirebaseError,
	};
});
