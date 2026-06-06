<template>
	<div
		class="flex flex-col w-screen h-screen surface-ground overflow-hidden px-0 py-0 sm:px-4 sm:py-2">
		<!-- NavBar — tylko desktop -->
		<div class="hidden sm:block px-4 pt-2">
			<NavBar v-if="showNavbar" />
			<Divider
				v-if="showNavbar"
				class="w-3/4 self-center" />
		</div>

		<Loader></Loader>
		<div class="flex-1 flex flex-col min-h-0 content-scroll">
			<RouterView />
			<GuestExpiredModal />
		</div>

		<!-- Mobile bottom tab bar — fixed -->
		<div class="sm:hidden fixed bottom-0 left-0 right-0 z-50">
			<MobileTabBar v-if="showNavbar" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useLoaderStore } from "./stores/loader";
import Loader from "./components/home_view/Loader.vue";
import GuestExpiredModal from "./components/home_view/GuestExpiredModal.vue";

import NavBar from "@/components/navbar/NavBar.vue";
import MobileTabBar from "@/components/navbar/MobileTabBar.vue";
import Divider from "primevue/divider";

const route = useRoute();

// ukryj navbar/tabbar na ekranach logowania
const showNavbar = computed(() => {
	return !["/login", "/register"].includes(route.path);
});
</script>
