<template>
	<nav class="mobile-tab-bar">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			class="tab-btn"
			:class="{ active: activeTab === tab.id }"
			@click="onTab(tab)">
			<i :class="['pi', tab.icon, 'tab-icon']"></i>
			<span class="tab-label">{{ tab.label }}</span>
		</button>
	</nav>

	<!-- Profile dialog -->
	<ProfileDialog v-model="showProfile" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { useCommonStore } from "@/stores/common";
import { useAuthStore } from "@/stores/auth";
import { useHabbitsStore } from "@/stores/habbits";
import ProfileDialog from "@/components/navbar/ProfileDialog.vue";

const carouselStore = useCarouselStore();
const commonStore = useCommonStore();
const { isDarkMode } = storeToRefs(commonStore);
const authStore = useAuthStore();
const habbitsStore = useHabbitsStore();
const { dailyGoalsList, userHabbitsList } = storeToRefs(habbitsStore);

const showProfile = ref(false);

// Zakładki karuzelowe mapowane na ID karty
const cardTabs = ["textAdd", "manage", "stats"] as const;

const activeTab = computed(() => {
	const id = carouselStore.activeCardId;
	if (cardTabs.includes(id as any)) return id;
	return "profile";
});

const tabs = [
	{ id: "theme",   label: "Theme",   icon: "pi-moon",        type: "action" },
	{ id: "textAdd", label: "To-do",   icon: "pi-list-check",  type: "card" },
	{ id: "manage",  label: "Habits",  icon: "pi-star",        type: "card" },
	{ id: "stats",   label: "Stats",   icon: "pi-chart-bar",   type: "card" },
	{ id: "profile", label: "Profile", icon: "pi-user",        type: "action" },
] as const;

function onTab(tab: (typeof tabs)[number]) {
	if (tab.type === "card") {
		carouselStore.setActiveCard(tab.id as any);
	} else if (tab.id === "profile") {
		showProfile.value = true;
	} else if (tab.id === "theme") {
		isDarkMode.value = !isDarkMode.value;
		if (isDarkMode.value) {
			document.documentElement.classList.add("my-app-dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("my-app-dark");
			localStorage.setItem("theme", "light");
		}
	}
}
</script>

<style scoped>
.mobile-tab-bar {
	display: flex;
	flex-direction: row;
	align-items: stretch;
	width: 100%;
	background: var(--p-surface-0, white);
	border-top: 1px solid color-mix(in srgb, var(--p-orange-100) 80%, transparent);
	padding: 0.25rem 0 env(safe-area-inset-bottom, 0.25rem);
	gap: 0;
}

:where(.my-app-dark, .my-app-dark *) .mobile-tab-bar {
	background: var(--p-gray-900);
	border-top-color: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}

.tab-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.2rem;
	padding: 0.45rem 0.25rem;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 0.75rem;
	transition: background 0.18s ease, transform 0.15s ease;
	position: relative;
}

.tab-btn:active {
	transform: scale(0.9);
}

.tab-icon {
	font-size: 1.2rem;
	color: var(--p-gray-400);
	transition: color 0.18s ease, transform 0.2s ease;
}

:where(.my-app-dark, .my-app-dark *) .tab-icon {
	color: var(--p-gray-500);
}

.tab-label {
	font-size: 0.6rem;
	color: var(--p-gray-400);
	font-family: "Lora", serif;
	transition: color 0.18s ease;
}

:where(.my-app-dark, .my-app-dark *) .tab-label {
	color: var(--p-gray-500);
}

/* Aktywna zakładka */
.tab-btn.active .tab-icon {
	color: var(--p-orange-500);
	transform: translateY(-2px) scale(1.15);
}

.tab-btn.active .tab-label {
	color: var(--p-orange-500);
	font-weight: 600;
}

/* Aktywny indicator — mała kreska u góry */
.tab-btn.active::before {
	content: "";
	position: absolute;
	top: 0;
	left: 25%;
	right: 25%;
	height: 2.5px;
	border-radius: 0 0 3px 3px;
	background: var(--p-orange-400);
}

:where(.my-app-dark, .my-app-dark *) .tab-btn.active::before {
	background: var(--p-orange-500);
}
</style>
