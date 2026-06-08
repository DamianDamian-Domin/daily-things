<template>
	<div
		class="flex flex-col w-screen h-dvh min-h-dvh surface-ground overflow-hidden"
		:class="isMobileLayout ? 'px-0 py-0' : 'px-0 py-0 sm:px-4 sm:py-2'">
		<!-- NavBar — tylko desktop -->
		<div
			v-if="showNavbar && !isMobileLayout"
			class="px-4 pt-2">
			<NavBar />
			<Divider class="w-3/4 self-center" />
		</div>

		<Loader></Loader>
		<div class="flex-1 flex flex-col min-h-0 content-scroll">
			<RouterView />
		</div>

		<!-- Mobile bottom tab bar — fixed -->
		<div
			v-if="showNavbar && isMobileLayout"
			class="fixed bottom-0 left-0 right-0 z-50">
			<MobileTabBar />
		</div>

		<CookiesConsentBanner :bottom-offset="cookieBannerOffset" />
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useLoaderStore } from "./stores/loader";
import Loader from "./components/home_view/Loader.vue";

import NavBar from "@/components/navbar/NavBar.vue";
import MobileTabBar from "@/components/navbar/MobileTabBar.vue";
import CookiesConsentBanner from "@/components/CookiesConsentBanner.vue";
import Divider from "primevue/divider";

const route = useRoute();

const isMobileLayout = ref(false);
const mobileLayoutQuery =
	"(max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse)";
let mediaQueryList: MediaQueryList | null = null;

function updateMobileLayout() {
	if (!mediaQueryList) return;
	isMobileLayout.value = mediaQueryList.matches;
}

onMounted(() => {
	mediaQueryList = window.matchMedia(mobileLayoutQuery);
	updateMobileLayout();
	mediaQueryList.addEventListener("change", updateMobileLayout);
});

onBeforeUnmount(() => {
	mediaQueryList?.removeEventListener("change", updateMobileLayout);
});

// ukryj navbar/tabbar na ekranach logowania
const showNavbar = computed(() => {
	return !["/login", "/register"].includes(route.path);
});

const cookieBannerOffset = computed(() => {
	return showNavbar.value && isMobileLayout.value ? 68 : 0;
});
</script>
