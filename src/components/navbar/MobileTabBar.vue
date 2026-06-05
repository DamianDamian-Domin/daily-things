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

	<Sidebar
		v-model:visible="showPreferences"
		position="bottom"
		class="h-auto rounded-t-2xl pb-4">
		<template #header>
			<div class="flex items-center gap-2">
				<i class="pi pi-cog text-xl"></i>
				<span class="font-bold text-lg">App Preferences</span>
			</div>
		</template>

		<div class="flex flex-col gap-6 py-2 px-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
						<i
							:class="
								preferencesStore.isDarkMode
									? 'pi pi-moon text-indigo-400'
									: 'pi pi-sun text-orange-400'
							"></i>
					</div>
					<div>
						<h4 class="font-semibold m-0 text-surface-900 dark:text-surface-0">
							Dark Mode
						</h4>
						<p class="text-sm text-surface-500 m-0">Change app appearance</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.isDarkMode" />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
						<i
							:class="
								preferencesStore.soundEnabled
									? 'pi pi-volume-up text-green-500'
									: 'pi pi-volume-off text-surface-400'
							"></i>
					</div>
					<div>
						<h4 class="font-semibold m-0 text-surface-900 dark:text-surface-0">
							Sound Effects
						</h4>
						<p class="text-sm text-surface-500 m-0">Play UI sounds</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.soundEnabled" />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
						<i
							:class="
								preferencesStore.animationsEnabled
									? 'pi pi-sparkles text-yellow-500'
									: 'pi pi-stop-circle text-surface-400'
							"></i>
					</div>
					<div>
						<h4 class="font-semibold m-0 text-surface-900 dark:text-surface-0">
							Animations
						</h4>
						<p class="text-sm text-surface-500 m-0">
							Confetti and visual effects
						</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.animationsEnabled" />
			</div>
		</div>
	</Sidebar>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useCarouselStore } from "@/stores/useCarouselStore";

// 1. Zastępujemy commonStore naszym nowym preferencesStore
import { usePreferencesStore } from "@/stores/userPreferences";

// Importy komponentów PrimeVue (jeśli masz je zarejestrowane globalnie, te dwie linijki mogą nie być konieczne)
import Sidebar from "primevue/sidebar";
import ToggleSwitch from "primevue/toggleswitch"; // Lub "primevue/inputswitch" w starszym PrimeVue

const carouselStore = useCarouselStore();
const preferencesStore = usePreferencesStore();

const showPreferences = ref(false); // Steruje wysuwaniem panelu z dołu

// Zakładki karuzelowe mapowane na ID karty
const cardTabs = ["textAdd", "manage", "stats", "profile"] as const;

const activeTab = computed(() => {
	const id = carouselStore.activeCardId;
	if (cardTabs.includes(id as any)) return id;
	return "manage";
});

const tabs = [
	// 2. Zmieniamy Theme na Settings i ikonę na pi-cog
	{ id: "settings", label: "Settings", icon: "pi-cog", type: "action" },
	{ id: "textAdd", label: "To-do", icon: "pi-list-check", type: "card" },
	{ id: "manage", label: "Habits", icon: "pi-star", type: "card" },
	{ id: "stats", label: "Stats", icon: "pi-chart-bar", type: "card" },
	{ id: "profile", label: "Profile", icon: "pi-user", type: "card" },
] as const;

function onTab(tab: (typeof tabs)[number]) {
	if (tab.type === "card") {
		carouselStore.setActiveCard(tab.id as any);
	} else if (tab.id === "settings") {
		// 3. Po kliknięciu w zębatkę, otwieramy panel boczny z dołu
		showPreferences.value = true;
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
	transition:
		background 0.18s ease,
		transform 0.15s ease;
	position: relative;
}

.tab-btn:active {
	transform: scale(0.9);
}

.tab-icon {
	font-size: 1.2rem;
	color: var(--p-gray-400);
	transition:
		color 0.18s ease,
		transform 0.2s ease;
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
