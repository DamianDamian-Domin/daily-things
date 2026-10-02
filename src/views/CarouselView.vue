<template>
	<div class="carousel-root">
		<!-- DESKTOP: trzy karty, boczne jako podgląd -->
		<div
			v-if="!isMobile"
			class="carousel-view desktop-carousel">
			<div
				v-for="item in visibleCards"
				:key="item.card.id"
				class="carousel-card"
				:class="`role-${item.role}`"
				:inert="item.role !== 'active' || undefined">
				<component
					:is="cardComponentMap[item.card.id]"
					:isActive="item.role === 'active'" />
			</div>
			<button
				v-if="carouselStore.leftCard"
				type="button"
				class="side-hit side-left"
				:aria-label="`Show ${cardLabels[carouselStore.leftCard.id]}`"
				@click="goPrevWithAnimation">
				<i
					class="pi pi-chevron-left"
					aria-hidden="true"></i>
			</button>
			<button
				v-if="carouselStore.rightCard"
				type="button"
				class="side-hit side-right"
				:aria-label="`Show ${cardLabels[carouselStore.rightCard.id]}`"
				@click="goNextWithAnimation">
				<i
					class="pi pi-chevron-right"
					aria-hidden="true"></i>
			</button>
		</div>

		<!-- Kropki nawigacji (desktop) -->
		<div
			v-if="!isMobile"
			class="carousel-dots"
			role="tablist"
			aria-label="Cards">
			<button
				v-for="card in carouselStore.cards"
				:key="card.id"
				type="button"
				role="tab"
				class="dot"
				:class="{ active: card.id === carouselStore.activeCardId }"
				:aria-selected="card.id === carouselStore.activeCardId"
				:aria-label="cardLabels[card.id]"
				@click="onDotClick(card.id)" />
		</div>

		<!-- MOBILE: jedna karta na pełną szerokość, przesuwana gestem -->
		<div
			v-else
			class="mobile-carousel">
			<TransitionGroup
				:name="`slide-${carouselStore.direction}`"
				tag="div"
				class="mobile-track">
				<div
					:key="carouselStore.activeCardId"
					class="mobile-card">
					<component
						:is="cardComponentMap[carouselStore.activeCard.id]"
						:isActive="true" />
				</div>
			</TransitionGroup>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { CarouselCardConfig } from "@/libs/types";
type CarouselRole = "left" | "active" | "right";
type VisibleCarouselCard = {
	role: CarouselRole;
	card: CarouselCardConfig;
};
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { useLayout } from "@/utils/useLayout";

import ToDosCard from "../components/home_view/ToDosCard.vue";
import StatsCard from "../components/home_view/StatsCard.vue";
import HabbitsCard from "@/components/home_view/HabbitsCard.vue";

const carouselStore = useCarouselStore();
const { isMobile } = useLayout();
const TRANSITION_DURATION_MS = 420;

const isAnimating = ref(false);

const cardComponentMap = {
	manage: HabbitsCard,
	textAdd: ToDosCard,
	stats: StatsCard,
} as const;

const cardLabels: Record<CarouselCardConfig["id"], string> = {
	textAdd: "To-do list",
	manage: "Today's habits",
	stats: "Progress",
};

const visibleCards = computed<VisibleCarouselCard[]>(() => {
	const candidates = [
		{ role: "left", card: carouselStore.leftCard },
		{ role: "active", card: carouselStore.activeCard },
		{ role: "right", card: carouselStore.rightCard },
	];
	return candidates.filter(
		(item): item is VisibleCarouselCard => item.card !== null,
	);
});

function withAnimationLock(action: () => void) {
	if (isAnimating.value) return;
	isAnimating.value = true;
	action();
	window.setTimeout(() => {
		isAnimating.value = false;
	}, TRANSITION_DURATION_MS);
}

function goNextWithAnimation() {
	if (!carouselStore.rightCard) return;
	withAnimationLock(() => carouselStore.goNext());
}

function goPrevWithAnimation() {
	if (!carouselStore.leftCard) return;
	withAnimationLock(() => carouselStore.goPrev());
}

function onDotClick(targetId: CarouselCardConfig["id"]) {
	if (targetId === carouselStore.activeCardId) return;
	withAnimationLock(() => carouselStore.setActiveCard(targetId));
}

// Strzałki ←/→ przełączają karty (gdy nie piszemy w polu tekstowym)
function onKeydown(event: KeyboardEvent) {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	const target = event.target as HTMLElement | null;
	if (target?.closest("input, textarea, [contenteditable='true'], .p-dialog, .p-drawer")) return;
	if (event.key === "ArrowRight") goNextWithAnimation();
	if (event.key === "ArrowLeft") goPrevWithAnimation();
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.carousel-root {
	display: flex;
	flex-direction: column;
	min-height: 0;
}

/* ====== SHARED DOTS ====== */
.carousel-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 6px;
	margin-bottom: 8px;
}
@media (max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse) {
	.carousel-dots { display: none; }
}
/* Obszar kliknięcia 24px, widoczna kropka 8px */
.dot {
	position: relative;
	width: 24px;
	height: 24px;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 50%;
}
.dot::before {
	content: "";
	position: absolute;
	inset: 8px;
	border-radius: 50%;
	background-color: var(--dt-border-strong);
	transition: transform 250ms ease, background-color 250ms ease;
}
.dot.active::before {
	background-color: var(--dt-accent);
	transform: scale(1.5);
}

/* ====== DESKTOP CAROUSEL (hidden on mobile) ====== */
.desktop-carousel {
	position: relative;
	width: 100%;
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	--carousel-side-offset: clamp(180px, 22vw, 300px);
	--carousel-side-scale: 0.92;
	--carousel-side-opacity: 0.58;
}
.carousel-card {
	position: absolute;
	top: 50%;
	left: 50%;
	height: 94%;
	max-height: 50rem;
	display: flex;
	align-items: stretch;
	justify-content: center;
	will-change: transform, opacity;
	backface-visibility: hidden;
	transition:
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 320ms ease,
		filter 320ms ease;
}
.role-active {
	transform: translate(-50%, -50%) scale(1);
	opacity: 1;
	filter: saturate(1);
	z-index: 3;
}
.role-left {
	transform: translate(calc(-50% - var(--carousel-side-offset)), -50%) scale(var(--carousel-side-scale));
	opacity: var(--carousel-side-opacity);
	filter: saturate(0.9);
	z-index: 2;
}
.role-right {
	transform: translate(calc(-50% + var(--carousel-side-offset)), -50%) scale(var(--carousel-side-scale));
	opacity: var(--carousel-side-opacity);
	filter: saturate(0.9);
	z-index: 2;
}
/* Przezroczyste pola kliknięcia nad kartami bocznymi */
.side-hit {
	position: absolute;
	top: 8%;
	bottom: 8%;
	width: clamp(80px, 12vw, 180px);
	z-index: 4;
	display: flex;
	align-items: center;
	border: none;
	background: transparent;
	color: var(--dt-text-3);
	cursor: pointer;
	border-radius: var(--dt-radius-xl);
}
.side-hit i {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: var(--dt-surface);
	box-shadow: var(--dt-shadow);
	opacity: 0;
	transition: opacity 0.2s ease;
}
.side-hit:hover i,
.side-hit:focus-visible i {
	opacity: 1;
}
.side-left {
	left: 0;
	justify-content: flex-start;
	padding-left: 1rem;
}
.side-right {
	right: 0;
	justify-content: flex-end;
	padding-right: 1rem;
}

/* ====== MOBILE CAROUSEL (hidden on desktop) ====== */
.mobile-carousel {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	position: relative;
	width: 100%;
	overflow-x: hidden;
	touch-action: pan-y;
}
.mobile-track {
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
}
.mobile-card {
	width: 100%;
	height: 100%;
	padding: 0 0.75rem 1rem;
	display: flex;
	flex-direction: column;
	will-change: transform, opacity;
	backface-visibility: hidden;
}
.mobile-card > * { width: 100%; flex: 1; min-height: 0; }

/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
	transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease;
}
.slide-left-enter-from  { transform: translate3d(30%, 0, 0); opacity: 0; }
.slide-left-leave-to    { transform: translate3d(-30%, 0, 0); opacity: 0; }
.slide-right-enter-from { transform: translate3d(-30%, 0, 0); opacity: 0; }
.slide-right-leave-to   { transform: translate3d(30%, 0, 0); opacity: 0; }
.slide-left-leave-active,
.slide-right-leave-active {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
	.carousel-card,
	.slide-left-enter-active,
	.slide-left-leave-active,
	.slide-right-enter-active,
	.slide-right-leave-active,
	.dot {
		transition: none !important;
		animation: none !important;
	}
}

/* ====== RESPONSIVE SWITCH ====== */
@media (max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse) {
	.desktop-carousel { display: none; }
	.mobile-carousel  { display: flex; flex-direction: column; flex: 1; min-height: 0; }
	.mobile-track { flex: 1; min-height: 0; }
}
</style>
