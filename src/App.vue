<template>
	<div
		class="app-shell"
		:class="{ 'is-mobile': isMobileLayout }">
		<a
			href="#main"
			class="skip-link"
			>Skip to content</a
		>

		<header
			v-if="showChrome && !isMobileLayout"
			class="app-header">
			<NavBar />
		</header>

		<main
			id="main"
			class="app-main content-scroll"
			tabindex="-1">
			<RouterView />
		</main>

		<MobileTabBar v-if="showChrome && isMobileLayout" />

		<CookiesConsentBanner
			v-if="!isLoginRoute && !authStore.isAuthDialogOpen"
			:bottom-offset="bottomOffset" />
		<AuthDialog v-if="authDialogNeeded" />
		<ToastHost :bottom-offset="bottomOffset" />
	</div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useHabbitsStore } from "@/stores/habbits";
import { useTodosStore } from "@/stores/todos";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useToastStore } from "@/stores/toast";
import { fetchUserDoc } from "@/services/userData";
import { isNativePlatform } from "@/utils/platform";
import { useLayout } from "@/utils/useLayout";

import NavBar from "@/components/navbar/NavBar.vue";
import MobileTabBar from "@/components/navbar/MobileTabBar.vue";
import CookiesConsentBanner from "@/components/CookiesConsentBanner.vue";
// Okno logowania ładujemy dopiero, gdy jest potrzebne (powracający
// użytkownicy nigdy go nie pobiorą)
const AuthDialog = defineAsyncComponent(() => import("@/components/login_view/AuthDialog.vue"));
import ToastHost from "@/components/ui/ToastHost.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const habbitsStore = useHabbitsStore();
const todosStore = useTodosStore();
const preferencesStore = usePreferencesStore();
const toast = useToastStore();

// ==========================================
// UKŁAD (mobile / desktop)
// ==========================================
const { isMobile: isMobileLayout } = useLayout();

const isLoginRoute = computed(() => route.name === "login");
const authDialogNeeded = ref(false);
watch(
	() => authStore.isAuthDialogOpen,
	(open) => {
		if (open) authDialogNeeded.value = true;
	},
	{ immediate: true },
);
const showChrome = computed(() => !isLoginRoute.value);
const bottomOffset = computed(() => (showChrome.value && isMobileLayout.value ? 68 : 0));

// ==========================================
// SESJA — jedno miejsce, które ładuje dane zalogowanego użytkownika
// ==========================================
async function loadSession(uid: string) {
	try {
		const userDoc = await fetchUserDoc(uid);
		if (authStore.userUid !== uid) return;
		preferencesStore.hydrate(userDoc);
		habbitsStore.hydrate(userDoc);
		todosStore.hydrate(userDoc);
		await habbitsStore.loadInitialHistory();
	} catch (err) {
		console.error("Session load failed", err);
		toast.error("We couldn't load your data. Check your connection.");
	}
}

watch(
	() => [authStore.userUid, authStore.dataRevision] as const,
	async ([uid]) => {
		habbitsStore.clearData();
		todosStore.clearData();

		if (!uid) {
			if (isNativePlatform) {
				authStore.openAuthDialog("login");
				if (!isLoginRoute.value) await router.replace({ name: "login" });
			} else {
				// Web: pierwsze wejście → ekran powitalny. Zamknięcie go = tryb gościa.
				authStore.openAuthDialog("welcome");
			}
			return;
		}

		if (isNativePlatform && isLoginRoute.value) await router.replace({ name: "home" });
		await loadSession(uid);
	},
	{ immediate: true },
);
</script>

<style scoped>
.app-shell {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100dvh;
	min-height: 100dvh;
	overflow: hidden;
	background: var(--dt-bg);
}

.app-header {
	padding: 0.5rem 1.25rem 0;
}

.app-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	outline: none;
}

.skip-link {
	position: absolute;
	left: 0.75rem;
	top: -3rem;
	z-index: 10000;
	padding: 0.5rem 0.9rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	font-weight: 600;
	transition: top 0.2s ease;
}
.skip-link:focus {
	top: 0.75rem;
}
</style>
