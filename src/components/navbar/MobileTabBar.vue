<template>
	<nav
		class="tabbar"
		aria-label="Main">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			type="button"
			class="tab"
			:class="{ active: isActive(tab.id) }"
			:aria-current="isActive(tab.id) ? 'page' : undefined"
			@click="onTab(tab.id)">
			<span class="tab-icon-wrap">
				<i
					:class="['pi', tab.icon]"
					aria-hidden="true"></i>
				<span
					v-if="tab.id === 'me' && authStore.isGuest"
					class="tab-dot"
					aria-hidden="true"></span>
			</span>
			<span class="tab-label">{{ tab.label }}</span>
			<span
				v-if="tab.id === 'me' && authStore.isGuest"
				class="sr-only"
				>(progress not saved yet)</span
			>
		</button>
	</nav>

	<AccountSheet
		v-model="accountOpen"
		position="bottom" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { useAuthStore } from "@/stores/auth";
const AccountSheet = defineAsyncComponent(() => import("@/components/settings/AccountSheet.vue"));

type TabId = "textAdd" | "manage" | "stats" | "me";

const carouselStore = useCarouselStore();
const authStore = useAuthStore();
const accountOpen = ref(false);

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
	{ id: "textAdd", label: "To-do", icon: "pi-list-check" },
	{ id: "manage", label: "Today", icon: "pi-sun" },
	{ id: "stats", label: "Progress", icon: "pi-chart-bar" },
	{ id: "me", label: "Me", icon: "pi-user" },
];

function isActive(id: TabId) {
	if (id === "me") return accountOpen.value;
	return !accountOpen.value && carouselStore.activeCardId === id;
}

function onTab(id: TabId) {
	if (id === "me") {
		accountOpen.value = true;
		return;
	}
	accountOpen.value = false;
	carouselStore.setActiveCard(id);
}
</script>

<style scoped>
.tabbar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 50;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	height: calc(var(--dt-tabbar-h) + env(safe-area-inset-bottom, 0px));
	padding: 0.35rem 0.5rem env(safe-area-inset-bottom, 0px);
	background: var(--dt-surface);
	border-top: 1px solid var(--dt-border);
	box-shadow: 0 -6px 20px -12px rgba(120, 53, 15, 0.25);
}
.tab {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.2rem;
	border: none;
	background: transparent;
	color: var(--dt-text-3);
	font-size: 0.72rem;
	font-weight: 600;
	cursor: pointer;
	border-radius: var(--dt-radius);
	transition: color 0.2s ease;
}
.tab-icon-wrap {
	position: relative;
	display: grid;
	place-items: center;
	width: 3.2rem;
	height: 1.9rem;
	border-radius: var(--dt-radius-pill);
	transition:
		background-color 0.25s ease,
		transform 0.25s var(--dt-spring);
}
.tab-icon-wrap i {
	font-size: 1.1rem;
}
.tab.active {
	color: var(--dt-accent-ink);
}
.tab.active .tab-icon-wrap {
	background: var(--dt-accent-soft);
	transform: translateY(-1px);
}
.tab-dot {
	position: absolute;
	top: 0.15rem;
	right: 0.7rem;
	width: 0.55rem;
	height: 0.55rem;
	border-radius: 50%;
	background: var(--dt-accent);
	border: 2px solid var(--dt-surface);
}
</style>
