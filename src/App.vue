<template>
	<div
		class="flex flex-col w-screen h-dvh min-h-dvh surface-ground overflow-hidden"
		:class="isMobileLayout ? 'px-0 py-0' : 'px-0 py-0 sm:px-4 sm:py-2'">
		<div
			v-if="showNavbar && !isMobileLayout"
			class="px-4 pt-2">
			<NavBar />
			<Divider
				v-if="showNavbar"
				class="w-3/4 self-center" />
		</div>

		<Loader></Loader>
		<div class="flex-1 flex flex-col min-h-0 content-scroll">
			<RouterView />
			<GuestExpiredModal />
		</div>

		<div
			v-if="showNavbar && isMobileLayout"
			class="fixed bottom-0 left-0 right-0 z-50">
			<MobileTabBar />
		</div>

		<CookiesConsentBanner :bottom-offset="cookieBannerOffset" />
		<GuestInfoDialog />
		<AuthDialog />
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useLoaderStore } from "./stores/loader";
import { useAuthStore } from "@/stores/auth";
import { useHabbitsStore } from "@/stores/habbits";
import { useTodosStore } from "@/stores/todos";

import Loader from "./components/home_view/Loader.vue";
import GuestExpiredModal from "./components/home_view/GuestExpiredModal.vue";
import NavBar from "@/components/navbar/NavBar.vue";
import MobileTabBar from "@/components/navbar/MobileTabBar.vue";
import CookiesConsentBanner from "@/components/CookiesConsentBanner.vue";
import AuthDialog from "@/components/login_view/AuthDialog.vue";
import GuestInfoDialog from "@/components/navbar/GuestInfoDialog.vue";
import Divider from "primevue/divider";
import { watch } from "vue";

const route = useRoute();
const authStore = useAuthStore();
const habbitsStore = useHabbitsStore();
const todosStore = useTodosStore();

const isMobileLayout = ref(false);
const mobileLayoutQuery =
	"(max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse)";
let mediaQueryList: MediaQueryList | null = null;

function updateMobileLayout() {
	if (!mediaQueryList) return;
	isMobileLayout.value = mediaQueryList.matches;
}

onMounted(async () => {
	mediaQueryList = window.matchMedia(mobileLayoutQuery);
	updateMobileLayout();
	mediaQueryList.addEventListener("change", updateMobileLayout);

	// --- NOWA LOGIKA STARTOWA ---
	// Pobieramy dane o sesji z Firebase
	await authStore.initAuth();

	// Jeśli nie ma użytkownika po załadowaniu aplikacji, otwieramy modal powitalny
	if (!authStore.user) {
		authStore.isAuthDialogOpen = true;
	}
});

onBeforeUnmount(() => {
	mediaQueryList?.removeEventListener("change", updateMobileLayout);
});

// Zmieniono na true, ponieważ nie chowamy już navbara na dedykowanej stronie logowania
const showNavbar = computed(() => {
	return true;
});

const cookieBannerOffset = computed(() => {
	return showNavbar.value && isMobileLayout.value ? 68 : 0;
});

// --- OBSERWATOR ZMIANY UŻYTKOWNIKA ---
watch(
	() => authStore.userUid,
	async (newUid) => {
		if (newUid) {
			// Ktoś się zalogował (lub wszedł jako gość) -> Pobieramy wszystkie dane
			await todosStore.loadTodos();
			await habbitsStore.loadDailyGoals();
			await habbitsStore.loadRecentHabbits();
			await habbitsStore.loadHabbitsForDate(new Date());
		} else {
			// Ktoś się wylogował -> Czyścimy stan aplikacji
			todosStore.clearData();
			habbitsStore.clearData();
		}
	},
	{ immediate: true }, // immediate: true upewnia się, że zadziała to od razu po załadowaniu apki
);
</script>
