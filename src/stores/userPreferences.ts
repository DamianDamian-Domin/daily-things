import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { UserPreferences } from "@/libs/types";
import { saveUserFields, type UserDoc } from "@/services/userData";
import { useAuthStore } from "@/stores/auth";

function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* tryb prywatny / zablokowany storage — ignorujemy */
	}
}

const media = (query: string) =>
	typeof window !== "undefined" && window.matchMedia?.(query).matches;

export const usePreferencesStore = defineStore("userPreferences", () => {
	const authStore = useAuthStore();

	// Domyślnie szanujemy ustawienia systemu (ciemny motyw, ograniczony ruch)
	const storedTheme = readStorage("theme");
	const isDarkMode = ref(
		storedTheme ? storedTheme === "dark" : Boolean(media("(prefers-color-scheme: dark)")),
	);
	const soundEnabled = ref(readStorage("soundEnabled") !== "false");
	const storedAnimations = readStorage("animationsEnabled");
	const animationsEnabled = ref(
		storedAnimations !== null
			? storedAnimations !== "false"
			: !media("(prefers-reduced-motion: reduce)"),
	);

	function applyTheme(dark: boolean) {
		document.documentElement.classList.toggle("my-app-dark", dark);
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute("content", dark ? "#1c1714" : "#fdf6ee");
	}
	applyTheme(isDarkMode.value);

	// Przy wczytywaniu z Firestore nie odsyłamy od razu tych samych wartości
	let hydrating = false;

	function snapshot(): UserPreferences {
		return {
			isDarkMode: isDarkMode.value,
			soundEnabled: soundEnabled.value,
			animationsEnabled: animationsEnabled.value,
		};
	}

	function persistRemote() {
		if (hydrating) return;
		const uid = authStore.userUid;
		if (!uid) return;
		saveUserFields(uid, { preferences: snapshot() }).catch((err) =>
			console.warn("Preferences save failed", err),
		);
	}

	function hydrate(userDoc: UserDoc) {
		const prefs = userDoc.preferences;
		if (!prefs) return;
		hydrating = true;
		if (typeof prefs.isDarkMode === "boolean") isDarkMode.value = prefs.isDarkMode;
		if (typeof prefs.soundEnabled === "boolean") soundEnabled.value = prefs.soundEnabled;
		if (typeof prefs.animationsEnabled === "boolean")
			animationsEnabled.value = prefs.animationsEnabled;
		// watchery odpalają się asynchronicznie — zdejmujemy flagę po nich
		queueMicrotask(() => {
			setTimeout(() => (hydrating = false), 0);
		});
	}

	watch(isDarkMode, (dark) => {
		writeStorage("theme", dark ? "dark" : "light");
		applyTheme(dark);
		persistRemote();
	});

	watch(soundEnabled, (enabled) => {
		writeStorage("soundEnabled", String(enabled));
		persistRemote();
	});

	watch(animationsEnabled, (enabled) => {
		writeStorage("animationsEnabled", String(enabled));
		document.documentElement.classList.toggle("reduce-motion", !enabled);
		persistRemote();
	});
	document.documentElement.classList.toggle("reduce-motion", !animationsEnabled.value);

	function toggleTheme() {
		isDarkMode.value = !isDarkMode.value;
	}

	return {
		isDarkMode,
		soundEnabled,
		animationsEnabled,
		toggleTheme,
		hydrate,
	};
});
