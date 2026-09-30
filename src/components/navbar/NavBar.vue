<template>
	<nav
		class="topbar"
		aria-label="Main">
		<RouterLink
			to="/"
			class="brand"
			aria-label="Daily Things — home">
			<img
				src="@/assets/logo.png"
				alt=""
				width="48"
				height="48"
				class="brand-logo" />
			<span class="brand-name">Daily Things</span>
		</RouterLink>

		<div class="topbar-actions">
			<button
				v-if="authStore.isGuest"
				type="button"
				class="dt-btn dt-btn-soft dt-btn-sm save-pill"
				@click="openAccount('profile')">
				<i
					class="pi pi-cloud-upload"
					aria-hidden="true"></i>
				Save your progress
			</button>

			<button
				type="button"
				class="dt-icon-btn"
				:aria-label="preferences.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
				@click="preferences.toggleTheme()">
				<i
					:class="preferences.isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
					aria-hidden="true"></i>
			</button>

			<button
				type="button"
				class="dt-icon-btn"
				aria-label="Settings"
				@click="openAccount('settings')">
				<i
					class="pi pi-cog"
					aria-hidden="true"></i>
			</button>

			<button
				type="button"
				class="avatar-btn"
				:aria-label="`Account: ${authStore.displayName || 'guest'}`"
				@click="openAccount('profile')">
				<img
					v-if="authStore.photoURL"
					:src="authStore.photoURL"
					alt=""
					referrerpolicy="no-referrer" />
				<span v-else>{{ authStore.initials || "?" }}</span>
			</button>
		</div>

		<AccountSheet
			v-model="accountOpen"
			position="right"
			:initial-tab="accountTab" />
	</nav>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/userPreferences";
const AccountSheet = defineAsyncComponent(() => import("@/components/settings/AccountSheet.vue"));

const authStore = useAuthStore();
const preferences = usePreferencesStore();

const accountOpen = ref(false);
const accountTab = ref<"profile" | "settings">("profile");

function openAccount(tab: "profile" | "settings") {
	accountTab.value = tab;
	accountOpen.value = true;
}
</script>

<style scoped>
.topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.25rem 0 0.5rem;
	border-bottom: 1px solid var(--dt-border);
}
.brand {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	text-decoration: none;
	color: var(--dt-text);
	border-radius: var(--dt-radius);
}
.brand-logo {
	width: 3rem;
	height: 3rem;
	object-fit: contain;
}
.brand-name {
	font-family: var(--dt-font-script);
	font-size: 2rem;
	line-height: 1;
	color: var(--dt-text-2);
}
.topbar-actions {
	display: flex;
	align-items: center;
	gap: 0.35rem;
}
.save-pill {
	margin-right: 0.35rem;
}
.avatar-btn {
	display: grid;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	margin-left: 0.25rem;
	border-radius: 0.9rem;
	border: 2px solid var(--dt-surface);
	overflow: hidden;
	background: linear-gradient(135deg, #f9c6a0, #f3a17a);
	color: #5a2c12;
	font-weight: 700;
	font-size: 0.9rem;
	cursor: pointer;
	box-shadow: var(--dt-shadow-sm);
	transition: transform 0.2s var(--dt-ease);
}
.avatar-btn:hover {
	transform: scale(1.05);
}
.avatar-btn img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>
