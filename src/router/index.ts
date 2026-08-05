import { createRouter, createWebHistory } from "vue-router";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/stores/auth";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
	],
});

router.beforeEach(async () => {
	const authStore = useAuthStore();
	const isNative = Capacitor.isNativePlatform();

	// 1. Upewniamy się, że stan autoryzacji Firebase został załadowany.
	// authStore.loading to stan, który ustawia się na false w initAuth(),
	// gdy onAuthStateChanged odpali się po raz pierwszy.
	if (authStore.loading) {
		await authStore.initAuth();
	}

	// 2. Logika wymuszonego okna logowania.
	// Jeżeli użytkownik nie jest zalogowany (brak sesji)...
	if (!authStore.isAuthenticated) {
		// ... a platforma to mobile, otwórz dialog i NIE wpuszczaj do aplikacji (jeśli byłyby tu inne podstrony, można wymusić zatrzymanie nawigacji wracając np. na '/login').
		// Z racji braku pełnych widoków logowania, otwieramy modal.
		if (isNative) {
			authStore.isAuthDialogOpen = true;
		}
		// ... na Webie nie zmuszamy do logowania z marszu – modal można odpalić,
		// ale użytkownik ma wybór (guzik gościa lub zamknięcie dialogu).
		else {
			authStore.isAuthDialogOpen = true;
		}
	}
});

export default router;
