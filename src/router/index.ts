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
  const auth = useAuthStore();

  if (!auth.initialized) {
    await auth.initAuth();
  }

  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && auth.user) {
    return { name: "home" };
  }
});

export default router;
