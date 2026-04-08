<template>
	<div
		class="flex flex-col w-screen h-screen surface-ground px-4 py-2 overflow-hidden">
		<!-- NavBar only on selected routes -->
		<NavBar v-if="showNavbar" />

		<Divider
			v-if="showNavbar"
			class="w-3/4 self-center" />
		<Loader></Loader>
		<FeedbackCheck
			:isVisible="feedbackCheckStore.isVisible"
			:typeCheck="feedbackCheckStore.typeCheck" />
		<div class="flex-1 flex flex-col overflow-hidden">
			<RouterView />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useLoaderStore } from "./stores/loader";
import { useFeedbackCheckStore } from "@/stores/useFeedbackCheck";
import FeedbackCheck from "./components/home_view/FeedbackCheck.vue";
import Loader from "./components/home_view/Loader.vue";

import NavBar from "@/components/navbar/NavBar.vue";
import Divider from "primevue/divider";

const route = useRoute();
const feedbackCheckStore = useFeedbackCheckStore();

// hide navbar on login/register routes
const showNavbar = computed(() => {
	return !["/login", "/register"].includes(route.path);
});
</script>
