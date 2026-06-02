import { defineStore } from "pinia";
import { ref, watch } from "vue";
// Dodane importy dla Firebase
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";

export const usePreferencesStore = defineStore("userPreferences", () => {
	// 1. Inicjalizacja stanu z localStorage (działa natychmiastowo przy wejściu na stronę)
	const isDarkMode = ref(
		localStorage.getItem("theme") === "dark" ||
			(!("theme" in localStorage) &&
				window.matchMedia("(prefers-color-scheme: dark)").matches),
	);
	const soundEnabled = ref(localStorage.getItem("soundEnabled") !== "false");
	const animationsEnabled = ref(
		localStorage.getItem("animationsEnabled") !== "false",
	);

	const applyTheme = (dark: boolean) => {
		if (dark) {
			document.documentElement.classList.add("my-app-dark");
		} else {
			document.documentElement.classList.remove("my-app-dark");
		}
	};

	applyTheme(isDarkMode.value);

	// ========================
	// NOWOŚĆ: Logika Firebase
	// ========================

	// Zapisywanie obecnych ustawień do Firestore
	const saveToFirebase = async () => {
		const auth = getAuth();
		if (!auth.currentUser) return; // Jeśli użytkownik nie jest zalogowany, ignoruj

		const docRef = doc(db, "users", auth.currentUser.uid);
		await setDoc(
			docRef,
			{
				preferences: {
					isDarkMode: isDarkMode.value,
					soundEnabled: soundEnabled.value,
					animationsEnabled: animationsEnabled.value,
				},
			},
			{ merge: true },
		); // merge: true sprawia, że nie nadpiszemy innych danych użytkownika!
	};

	// Pobieranie ustawień z Firestore
	const loadFromFirebase = async (userId: string) => {
		const docRef = doc(db, "users", userId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists() && docSnap.data().preferences) {
			const data = docSnap.data().preferences;

			// Aktualizacja zmiennych
			isDarkMode.value = data.isDarkMode;
			soundEnabled.value = data.soundEnabled;
			animationsEnabled.value = data.animationsEnabled;

			// Zapis do lokalnej pamięci, aby przy odświeżeniu strony załadowały się od razu
			localStorage.setItem("theme", data.isDarkMode ? "dark" : "light");
			localStorage.setItem("soundEnabled", String(data.soundEnabled));
			localStorage.setItem("animationsEnabled", String(data.animationsEnabled));

			applyTheme(data.isDarkMode);
		}
	};

	// ========================
	// Obserwatory (Watchers)
	// ========================

	watch(isDarkMode, (newVal) => {
		localStorage.setItem("theme", newVal ? "dark" : "light");
		applyTheme(newVal);
		saveToFirebase(); // Zapis globalny po zmianie
	});

	watch(soundEnabled, (newVal) => {
		localStorage.setItem("soundEnabled", String(newVal));
		saveToFirebase(); // Zapis globalny po zmianie
	});

	watch(animationsEnabled, (newVal) => {
		localStorage.setItem("animationsEnabled", String(newVal));
		saveToFirebase(); // Zapis globalny po zmianie
	});

	function toggleTheme() {
		isDarkMode.value = !isDarkMode.value;
	}

	return {
		isDarkMode,
		soundEnabled,
		animationsEnabled,
		toggleTheme,
		loadFromFirebase, // Eksportujemy tę funkcję, by wywołać ją przy logowaniu
	};
});
