<template>
	<nav
		class="topbar"
		:aria-label="m.mainNav">
		<RouterLink
			to="/"
			class="brand"
			:aria-label="m.home">
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
				{{ m.saveProgress }}
			</button>

			<button
				type="button"
				class="dt-icon-btn"
				:aria-label="preferences.isDarkMode ? m.toLightMode : m.toDarkMode"
				@click="preferences.toggleTheme()">
				<i
					:class="preferences.isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
					aria-hidden="true"></i>
			</button>

			<button
				type="button"
				class="dt-icon-btn"
				:aria-label="m.settings"
				@click="openAccount('settings')">
				<i
					class="pi pi-cog"
					aria-hidden="true"></i>
			</button>

			<button
				type="button"
				class="avatar-btn"
				:aria-label="m.account(authStore.displayName || m.guestLower)"
				@click="openAccount('profile')">
				<PixelAvatar
					:avatar="profileStore.avatar"
					:size="42" />
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
import { useProfileStore } from "@/stores/profile";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { shellMessages as m } from "@/i18n/messages/shell";
const AccountSheet = defineAsyncComponent(() => import("@/components/settings/AccountSheet.vue"));

const authStore = useAuthStore();
const preferences = usePreferencesStore();
const profileStore = useProfileStore();

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
	padding: 0;
	border: 2px solid var(--dt-surface);
	overflow: hidden;
	background: var(--dt-surface-sunken);
	cursor: pointer;
	box-shadow: var(--dt-shadow-sm);
	transition:
		transform var(--dt-t) var(--dt-ease),
		box-shadow var(--dt-t) ease;
}
@media (hover: hover) {
	.avatar-btn:hover {
		transform: translateY(var(--dt-lift));
		box-shadow: var(--dt-shadow-hover);
	}
}
.avatar-btn img {
	width: 100%;
	height: 100%;
	border-radius: 0 !important;
}
</style>
