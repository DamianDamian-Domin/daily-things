import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
			meta: { requiresAuth: true },
		},
		{
			path: "/login",
			name: "login",
			component: LoginView,
			meta: { guestOnly: true },
		},
	],
});

router.beforeEach(async (to) => {
	const authStore = useAuthStore();

	if (!authStore.initialized) {
		await authStore.initAuth();
	}

	// Jeśli strona wymaga logowania, a ktoś w ogóle nie ma sesji (ani gość, ani user) -> na logowanie
	if (to.meta.requiresAuth && !authStore.user) {
		return { name: "login" };
	}

	// ZMIANA TUTAJ:
	// Zablokuj stronę logowania tylko, jeśli ktoś JEST zalogowany i NIE JEST gościem
	if (to.meta.guestOnly && authStore.user && !authStore.isGuest) {
		return { name: "home" };
	}
});

export default router;
