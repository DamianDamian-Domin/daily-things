<template>
	<div
		class="flex flex-col gap-1 w-screen h-screen surface-ground px-4 py-2 overflow-auto">
		<!-- NavBar tylko na wybranych trasach -->
		<NavBar v-if="showNavbar" />

		<Divider
			v-if="showNavbar"
			class="w-3/4 self-center" />
		<Loader></Loader>
		<FeedbackCheck
			:isVisible="feedbackCheckStore.isVisible"
			:typeCheck="feedbackCheckStore.typeCheck" />
		<RouterView />
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

// ukryj navbar np. na login i register
const showNavbar = computed(() => {
	return !["/login", "/register"].includes(route.path);
});
</script>
