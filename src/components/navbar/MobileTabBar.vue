<template>
	<nav class="mobile-tab-bar">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			class="tab-btn"
			:class="{ active: activeTab === tab.id }"
			@click="onTab(tab)">
			<span
				v-if="
					tab.id === 'profile' &&
					authStore.isGuest &&
					authStore.showGuestNotification
				"
				class="absolute top-1.5 right-[25%] w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-gray-900 z-10"></span>

			<i :class="['pi', tab.icon, 'tab-icon']"></i>
			<span class="tab-label">{{ tab.label }}</span>
		</button>
	</nav>

	<Sidebar
		v-model:visible="showPreferences"
		position="bottom"
		class="h-auto rounded-t-2xl pb-4 custom-mobile-sidebar"
		:showCloseIcon="false">
		<template #header>
			<div
				class="flex items-center justify-between w-full pb-2 sidebar-header-border m-0">
				<div class="flex items-center gap-2 sidebar-title-wrap">
					<i class="pi pi-cog text-xl"></i>
					<span class="sidebar-title">App Preferences</span>
				</div>

				<button
					class="btn-close"
					@click="showPreferences = false">
					<i class="pi pi-times text-sm"></i>
				</button>
			</div>
		</template>

		<div class="flex flex-col gap-6 pt-4 pb-2 px-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full icon-circle flex items-center justify-center">
						<i
							:class="
								preferencesStore.isDarkMode
									? 'pi pi-moon text-indigo-400'
									: 'pi pi-sun text-orange-400'
							"></i>
					</div>
					<div>
						<h4 class="sidebar-label">Dark Mode</h4>
						<p class="sidebar-desc">Change app appearance</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.isDarkMode" />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full icon-circle flex items-center justify-center">
						<i
							:class="
								preferencesStore.soundEnabled
									? 'pi pi-volume-up text-green-500'
									: 'pi pi-volume-off text-surface-500 dark:text-surface-300'
							"></i>
					</div>
					<div>
						<h4 class="sidebar-label">Sound Effects</h4>
						<p class="sidebar-desc">Play UI sounds</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.soundEnabled" />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="w-10 h-10 rounded-full icon-circle flex items-center justify-center">
						<i
							:class="
								preferencesStore.animationsEnabled
									? 'pi pi-sparkles text-yellow-500'
									: 'pi pi-stop-circle text-surface-500 dark:text-surface-300'
							"></i>
					</div>
					<div>
						<h4 class="sidebar-label">Animations</h4>
						<p class="sidebar-desc">Confetti and visual effects</p>
					</div>
				</div>
				<ToggleSwitch v-model="preferencesStore.animationsEnabled" />
			</div>

			<div class="sidebar-divider"></div>

			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="icon-circle">
						<i class="pi pi-shield text-orange-500"></i>
					</div>
					<div>
						<h4 class="sidebar-label">Cookie Preferences</h4>
						<p class="sidebar-desc">Review and update consent</p>
					</div>
				</div>
				<Button
					label="Manage"
					size="small"
					class="btn-primary"
					@pointerup.stop="triggerManageCookies"
					@click.stop.prevent="triggerManageCookies" />
			</div>

			<div class="sidebar-divider"></div>

			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-4">
					<div class="w-10 h-10 rounded-full flex items-center justify-center">
						<i class="pi pi-file-edit icon-circle"></i>
					</div>
					<div>
						<h4 class="sidebar-label">Legal</h4>
						<p class="sidebar-desc">Privacy and service terms</p>
					</div>
				</div>
				<div class="grid w-full grid-cols-1 gap-2">
					<Button
						label="Privacy Policy"
						size="small"
						severity="secondary"
						class="legal-action-btn"
						@click="openLegalDocument('privacy')" />
					<Button
						label="Terms of Service"
						size="small"
						severity="secondary"
						class="legal-action-btn"
						@click="openLegalDocument('terms')" />
				</div>
			</div>
		</div>
	</Sidebar>
	<Sidebar
		v-model:visible="showProfile"
		position="bottom"
		class="h-auto max-h-[90vh] rounded-t-2xl pb-4 custom-mobile-sidebar"
		:showCloseIcon="false">
		<template #header>
			<div
				class="flex items-center justify-between w-full pb-2 sidebar-header-border m-0">
				<div class="flex items-center gap-2 sidebar-title-wrap">
					<i class="pi pi-user text-xl"></i>
					<span class="sidebar-title">Account</span>
				</div>

				<button
					class="btn-close"
					@click="showProfile = false">
					<i class="pi pi-times text-sm"></i>
				</button>
			</div>
		</template>

		<div class="px-4 pb-4 overflow-y-auto">
			<ProfileContent :isVisible="showProfile" />
		</div>
	</Sidebar>

	<LegalDocumentsDialog ref="legalDialogRef" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useCarouselStore } from "@/stores/useCarouselStore";
import LegalDocumentsDialog from "@/components/legal/LegalDocumentsDialog.vue";
import { useAuthStore } from "@/stores/auth";
import ProfileContent from "@/components/login_view/ProfileContent.vue";

// 1. Zastępujemy commonStore naszym nowym preferencesStore
import { usePreferencesStore } from "@/stores/userPreferences";
import { useCookieConsentStore } from "@/stores/cookieConsent";

// Importy komponentów PrimeVue (jeśli masz je zarejestrowane globalnie, te dwie linijki mogą nie być konieczne)
import Sidebar from "primevue/sidebar";
import ToggleSwitch from "primevue/toggleswitch"; // Lub "primevue/inputswitch" w starszym PrimeVue
import Button from "primevue/button";

const authStore = useAuthStore();
const carouselStore = useCarouselStore();
const preferencesStore = usePreferencesStore();
const cookieConsentStore = useCookieConsentStore();
const legalDialogRef = ref<{
	open: (document: "privacy" | "terms") => void;
} | null>(null);

const showPreferences = ref(false); // Steruje wysuwaniem panelu z dołu
const showProfile = ref(false); // Steruje wysuwaniem panelu profilu

// Zakładki karuzelowe mapowane na ID karty
const cardTabs = ["textAdd", "manage", "stats"] as const;

const activeTab = computed(() => {
	const id = carouselStore.activeCardId;
	if (cardTabs.includes(id as any)) return id;
	return "manage";
});

const tabs = [
	{ id: "settings", label: "Settings", icon: "pi-cog", type: "action" },
	{ id: "textAdd", label: "To-do", icon: "pi-list-check", type: "card" },
	{ id: "manage", label: "Habits", icon: "pi-star", type: "card" },
	{ id: "stats", label: "Stats", icon: "pi-chart-bar", type: "card" },
	{ id: "profile", label: "Profile", icon: "pi-user", type: "action" },
] as const;

function onTab(tab: (typeof tabs)[number]) {
	if (tab.id === "profile") {
		showProfile.value = true;
	} else if (tab.id === "settings") {
		showPreferences.value = true;
	} else if (tab.type === "card") {
		carouselStore.setActiveCard(tab.id as any);
	}
}

function onManageCookies() {
	if (typeof cookieConsentStore.reopenBanner === "function") {
		cookieConsentStore.reopenBanner();
	} else {
		cookieConsentStore.consent = null;
		localStorage.removeItem("cookieConsent.v1");
	}
	showPreferences.value = false;
}

const lastManageTriggerAt = ref(0);

function triggerManageCookies() {
	const now = Date.now();
	if (now - lastManageTriggerAt.value < 250) return;
	lastManageTriggerAt.value = now;
	onManageCookies();
}

function openLegalDocument(document: "privacy" | "terms") {
	showPreferences.value = false;
	legalDialogRef.value?.open(document);
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
	color: var(--p-gray-300);
}

.tab-label {
	font-size: 0.6rem;
	color: var(--p-gray-400);
	font-family: "Lora", serif;
	transition: color 0.18s ease;
}

:where(.my-app-dark, .my-app-dark *) .tab-label {
	color: var(--p-gray-300);
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

/* ====== TYPOGRAFIA SIDEBARÓW (Krok 2) ====== */
.sidebar-title-wrap {
	color: var(--p-gray-800);
}
.sidebar-title {
	font-family: "Lora", serif;
	font-size: 1.125rem;
	font-weight: 700;
}
:where(.my-app-dark, .my-app-dark *) .sidebar-title-wrap {
	color: var(--p-gray-100);
}

.sidebar-label {
	font-family: "Lora", serif;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--p-gray-800);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .sidebar-label {
	color: var(--p-gray-200);
}

.sidebar-desc {
	font-family: "Lora", serif;
	font-size: 0.8rem;
	color: var(--p-gray-500);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .sidebar-desc {
	color: var(--p-gray-400);
}

/* Subtelne linie podziału wewnątrz ustawień */
.sidebar-divider {
	width: 100%;
	height: 0; /* Ważne: 0, żeby tło nie pogrubiało linii */
	background: transparent !important; /* Blokujemy narzuty Tailwinda */
	border: none;
	border-top: 1px solid color-mix(in srgb, var(--p-gray-200) 80%, transparent);
	margin: 0;
}
.sidebar-header-border {
	border-bottom: 1px solid
		color-mix(in srgb, var(--p-gray-200) 80%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .sidebar-divider,
:where(.my-app-dark, .my-app-dark *) .sidebar-header-border {
	border-color: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
}

:where(.my-app-dark, .my-app-dark *) .tab-btn.active::before {
	background: var(--p-orange-500);
}

.legal-action-btn:deep(.p-button-label) {
	white-space: nowrap;
}

:deep(.custom-mobile-sidebar.p-sidebar) {
	background: var(--p-surface-0, white) !important;
	border: none !important;
}

:where(.my-app-dark, .my-app-dark *) :deep(.custom-mobile-sidebar.p-sidebar) {
	background: var(--p-gray-900, #111827) !important;
	/* Delikatna górna ramka (opcjonalnie, oddziela sidebar od czarnego tła ekranu) */
	border-top: 1px solid color-mix(in srgb, var(--p-gray-700) 60%, transparent) !important;
}
:deep(.p-sidebar-header) {
	padding: 0 !important;
	background: transparent !important;
	border: none !important;
	margin: 0 !important;
	display: block !important; /* Pozwala nam kontrolować strukturę w środku */
}

/* ====== PRZYCISKI I IKONY (Krok 3) ====== */
/* Okrągłe tła pod ikonami */
.icon-circle {
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: var(--p-gray-100);
	display: flex;
	align-items: center;
	border: 1px solid transparent;
	justify-content: center;
}
:where(.my-app-dark, .my-app-dark *) .icon-circle {
	background: var(--p-gray-800);
	border-color: var(--p-gray-700);
}

/* Główny przycisk akcji (np. Manage) */
.btn-primary {
	background: var(--p-orange-500) !important;
	color: white !important;
	border: none !important;
	border-radius: 0.5rem !important;
	font-family: "Lora", serif !important;
}
.btn-primary:hover {
	background: var(--p-orange-600) !important;
}

/* Przyciski pomocnicze (np. Legal) */
.btn-secondary {
	background: var(--p-gray-100) !important;
	color: var(--p-gray-700) !important;
	border: none !important;
	border-radius: 0.5rem !important;
	font-family: "Lora", serif !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-secondary {
	background: var(--p-gray-800) !important;
	color: var(--p-gray-200) !important;
}
.btn-secondary:hover {
	background: var(--p-gray-200) !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-secondary:hover {
	background: var(--p-gray-700) !important;
}

.btn-close {
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	cursor: pointer;
	background: var(--p-gray-100);
	color: var(--p-gray-500);
	transition:
		background 0.2s ease,
		color 0.2s ease;
}
.btn-close:hover {
	background: var(--p-gray-200);
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .btn-close {
	background: var(--p-gray-800);
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .btn-close:hover {
	background: var(--p-gray-700);
	color: var(--p-gray-200);
}

/* ====== 2. OKRĄGŁE TŁA POD IKONAMI ====== */
.icon-circle {
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--p-gray-100);
	flex-shrink: 0;
}
:where(.my-app-dark, .my-app-dark *) .icon-circle {
	background: var(--p-gray-800);
}

/* ====== 3. GŁÓWNY PRZYCISK AKCJI (np. Manage) ====== */
.btn-primary {
	background: var(--p-orange-500) !important;
	color: white !important;
	border: none !important;
	border-radius: 0.5rem !important;
	font-family: "Lora", serif !important;
	font-weight: 600 !important;
	transition:
		background 0.2s ease,
		transform 0.1s ease !important;
}
.btn-primary:hover {
	background: var(--p-orange-600) !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-primary {
	background: var(--p-orange-600) !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-primary:hover {
	background: var(--p-orange-500) !important;
}

/* ====== 4. PRZYCISKI POMOCNICZE (np. Legal) ====== */
.btn-secondary {
	background: var(--p-gray-100) !important;
	color: var(--p-gray-700) !important;
	border: none !important;
	border-radius: 0.5rem !important;
	font-family: "Lora", serif !important;
	font-weight: 500 !important;
	transition:
		background 0.2s ease,
		color 0.2s ease !important;
}
.btn-secondary:hover {
	background: var(--p-gray-200) !important;
	color: var(--p-gray-900) !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-secondary {
	background: var(--p-gray-800) !important;
	color: var(--p-gray-300) !important;
}
:where(.my-app-dark, .my-app-dark *) .btn-secondary:hover {
	background: var(--p-gray-700) !important;
	color: var(--p-gray-100) !important;
}

:deep(.p-toggleswitch .p-toggleswitch-slider) {
	background: var(--p-gray-300) !important;
	border: none !important;
	transition:
		background-color 0.2s ease,
		box-shadow 0.2s ease !important;
}
:deep(.p-toggleswitch .p-toggleswitch-slider::before) {
	background: white !important;
}

/* Stan niezaznaczony (Dark) - Tło (ścieżka) i gałka */
:where(.my-app-dark, .my-app-dark *)
	:deep(
		.p-toggleswitch:not(.p-toggleswitch-checked):not([data-p-checked="true"])
			.p-toggleswitch-slider
	) {
	background: var(--p-gray-700) !important;
}
:where(.my-app-dark, .my-app-dark *)
	:deep(
		.p-toggleswitch:not(.p-toggleswitch-checked):not([data-p-checked="true"])
			.p-toggleswitch-slider::before
	) {
	background: var(--p-gray-400) !important;
}

/* Stan zaznaczony (Light & Dark) - Zawsze pomarańczowy */
:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider),
:deep(.p-toggleswitch[data-p-checked="true"] .p-toggleswitch-slider) {
	background: var(--p-orange-500) !important;
}
:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider::before),
:deep(.p-toggleswitch[data-p-checked="true"] .p-toggleswitch-slider::before) {
	background: white !important;
}

/* Hover na włączonym przełączniku */
:deep(.p-toggleswitch.p-toggleswitch-checked:hover .p-toggleswitch-slider),
:deep(.p-toggleswitch[data-p-checked="true"]:hover .p-toggleswitch-slider) {
	background: var(--p-orange-600) !important;
}

/* Focus ring (estetyczna poświata przy kliknięciu/tabowaniu) */
:deep(.p-toggleswitch:focus-within .p-toggleswitch-slider) {
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-orange-500) 25%, transparent) !important;
}
</style>
