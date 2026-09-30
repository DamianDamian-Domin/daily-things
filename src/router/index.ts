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
		// Nieznane adresy wracają na stronę główną zamiast pustego ekranu
		{ path: "/:pathMatch(.*)*", redirect: "/" },
	],
});

router.beforeEach(async (to) => {
	const authStore = useAuthStore();
	await authStore.initAuth();

	// Web: gość może korzystać z aplikacji; /login nie jest potrzebne
	if (!isNativePlatform) {
		return to.name === "login" ? { name: "home", replace: true } : true;
	}

	// Aplikacja natywna: bez zalogowania widać wyłącznie ekran logowania
	if (!authStore.isAuthenticated && to.name !== "login") {
		authStore.openAuthDialog("login");
		return { name: "login", replace: true };
	}
	if (authStore.isAuthenticated && to.name === "login") {
		authStore.closeAuthDialog();
		return { name: "home", replace: true };
	}
	return true;
});

export default router;
