import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
			// Usunęliśmy restrykcje, każdy wchodzi prosto do aplikacji
		},
	],
});

router.beforeEach(async () => {
	const authStore = useAuthStore();

	// Sprawdzamy sesję z Supabase, ale nie rzucamy już przekierowaniami
	if (!authStore.initialized) {
		await authStore.initAuth();
	}
});

export default router;
