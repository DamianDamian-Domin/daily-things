<template>
	<Dialog
		v-model:visible="showModal"
		modal
		:dismissableMask="false"
		:closable="false"
		:closeOnEscape="false"
		:show-header="false"
		class="hs-dialog w-[clamp(22rem,85vw,42rem)]">
		<div class="hs-dialog-hero">
			<div
				class="hs-dialog-hero-bg"
				aria-hidden="true"></div>
			<span class="hs-dialog-emoji">⏳</span>
			<h3 class="hs-dialog-title">Koniec okresu próbnego!</h3>
			<p class="hs-dialog-subtitle">Czas zachować swoje dane</p>
		</div>

		<div
			class="hs-dialog-body flex flex-col items-center justify-center text-center">
			<p
				class="text-[0.95rem] leading-relaxed text-gray-600 dark:text-gray-400 mt-2 mb-2">
				Minęło 7 dni od uruchomienia aplikacji jako gość. Załóż darmowe konto,
				aby odblokować pełen dostęp i nie stracić swojej dotychczasowej historii
				celów i nawyków.
			</p>
		</div>

		<div class="hs-dialog-footer !justify-center">
			<button
				class="hs-done-btn w-full sm:w-3/4"
				@click="goToRegister">
				Przejdź do logowania
			</button>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter, useRoute } from "vue-router";
import Dialog from "primevue/dialog";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); // <-- Dodajemy użycie aktualnej ścieżki

const showModal = ref(false);

// Wyświetlamy modal TYLKO wtedy, gdy:
// 1. Czas gościa wygasł
// 2. NIE jesteśmy na stronie logowania (żeby go nie blokować)
watch(
	() => authStore.isGuestExpired && route.name !== "login",
	(shouldShow) => {
		showModal.value = shouldShow;
	},
	{ immediate: true },
);

const goToRegister = () => {
	router.push({ name: "login" });
};
</script>

<style scoped>
/* Skopiowane i dostosowane style z Twojej aplikacji */

:deep(.hs-dialog .p-dialog-content) {
	padding: 0 !important;
}

:deep(.hs-dialog.p-dialog) {
	border-radius: 1.25rem !important;
	overflow: hidden;
}

.hs-dialog-hero {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2rem 1.5rem 1.1rem;
	overflow: hidden;
	text-align: center;
}

.hs-dialog-hero-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--p-orange-100) 50%, transparent) 0%,
		transparent 100%
	);
	z-index: 0;
}

:where(.my-app-dark, .my-app-dark *) .hs-dialog-hero-bg {
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--p-orange-900) 20%, transparent) 0%,
		transparent 100%
	);
}

.hs-dialog-hero > *:not(.hs-dialog-hero-bg) {
	position: relative;
	z-index: 1;
}

.hs-dialog-emoji {
	font-size: 2rem;
	line-height: 1;
	margin-bottom: 0.45rem;
}

.hs-dialog-title {
	font-family: "Lora", serif;
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--p-gray-800);
	margin: 0;
}

:where(.my-app-dark, .my-app-dark *) .hs-dialog-title {
	color: var(--p-gray-100);
}

.hs-dialog-subtitle {
	font-size: 0.8rem;
	color: var(--p-gray-400);
	margin-top: 0.2rem;
}

:where(.my-app-dark, .my-app-dark *) .hs-dialog-subtitle {
	color: var(--p-gray-500);
}

.hs-dialog-body {
	padding: 1.5rem 1.75rem;
}

.hs-dialog-footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
	padding: 0.85rem 1.25rem;
	border-top: 1px solid var(--p-orange-100);
	background: color-mix(in srgb, var(--p-orange-50) 50%, white);
}

:where(.my-app-dark, .my-app-dark *) .hs-dialog-footer {
	border-top-color: var(--p-gray-700);
	background: color-mix(in srgb, var(--p-gray-800) 80%, transparent);
}

.hs-done-btn {
	padding: 0.6rem 1.5rem;
	border-radius: 0.65rem;
	border: none;
	background: var(--p-orange-500);
	color: white;
	font-family: "Lora", serif;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}

.hs-done-btn:hover {
	background: var(--p-orange-600);
	transform: translateY(-1px);
	box-shadow: 0 3px 10px
		color-mix(in srgb, var(--p-orange-500) 30%, transparent);
}

:where(.my-app-dark, .my-app-dark *) .hs-done-btn {
	background: var(--p-orange-600);
}

:where(.my-app-dark, .my-app-dark *) .hs-done-btn:hover {
	background: var(--p-orange-500);
}
</style>
