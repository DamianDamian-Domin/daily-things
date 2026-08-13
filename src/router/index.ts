import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { isNativePlatform } from "@/utils/platform";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/login",
			name: "login",
			component: LoginView,
		},
	],
});

router.beforeEach(async (to) => {
	const authStore = useAuthStore();

	if (authStore.loading) {
		await authStore.initAuth();
	}

	// Na webie użytkownik może zamknąć dialog lub kontynuować jako gość.
	if (!isNativePlatform) {
		return true;
	}

	// W aplikacji natywnej nieautoryzowany użytkownik nie może wejść do widoku
	// aplikacji. Trasa /login renderuje wyłącznie pełnoekranowy AuthDialog.
	if (!authStore.isAuthenticated && to.name !== "login") {
		authStore.isAuthDialogOpen = true;
		return { name: "login", replace: true };
	}

	if (authStore.isAuthenticated && to.name === "login") {
		authStore.isAuthDialogOpen = false;
		return { name: "home", replace: true };
	}

	if (!authStore.isAuthenticated) {
		authStore.isAuthDialogOpen = true;
	}

	return true;
});

export default router;
