<template>
	<!-- DOTS -->
	<div class="carousel-dots">
		<button
			v-for="(card, index) in carouselStore.cards"
			:key="card.id"
			class="dot"
			:class="{ active: card.id === carouselStore.activeCardId }"
			:aria-label="`Przejdź do karty ${index + 1}`"
			@click="onDotClick(card.id)" />
	</div>

	<!-- DESKTOP: 3-card layout -->
	<div
		class="carousel-view desktop-carousel"
		@pointerdown="onPointerDown"
		@pointerup="onPointerUp">
		<div
			v-for="item in visibleCards"
			:key="item.card.id"
			class="carousel-card"
			:class="`role-${item.role}`"
			@click="onCardClick(item.role)">
			<component
				:is="cardComponentMap[item.card.id]"
				:isActive="item.role === 'active'" />
		</div>
	</div>

	<!-- MOBILE: full-width single card with swipe -->
	<div
		class="mobile-carousel"
		@pointerdown="onPointerDown"
		@pointerup="onPointerUp"
		@pointercancel="onPointerCancel">
		<TransitionGroup :name="slideDirection" tag="div" class="mobile-track">
			<div
				:key="carouselStore.activeCardId"
				class="mobile-card">
				<component
					:is="cardComponentMap[carouselStore.activeCard!.id]"
					:isActive="true" />
			</div>
		</TransitionGroup>
	</div>
</template>

<script setup lang="ts">
import type { CarouselCardConfig } from "@/libs/types";
type CarouselRole = "left" | "active" | "right";
type VisibleCarouselCard = {
	role: CarouselRole;
	card: CarouselCardConfig;
};
import { computed, ref } from "vue";
import { useCarouselStore } from "@/stores/useCarouselStore";

import ToDosCard from "../components/home_view/ToDosCard.vue";
import StatsCard from "../components/home_view/StatsCard.vue";
import HabbitsCard from "@/components/home_view/HabbitsCard.vue";

const carouselStore = useCarouselStore();
const TRANSITION_DURATION_MS = 420;
const SWIPE_THRESHOLD = 48;
const SWIPE_DIRECTION_RATIO = 1.15;

const isAnimating = ref(false);
const slideDirection = ref<"slide-left" | "slide-right">("slide-left");

const cardComponentMap = {
	manage: HabbitsCard,
	textAdd: ToDosCard,
	stats: StatsCard,
} as const;

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
	slideDirection.value = "slide-left";
	withAnimationLock(() => carouselStore.goNext());
}

function goPrevWithAnimation() {
	if (!carouselStore.leftCard) return;
	slideDirection.value = "slide-right";
	withAnimationLock(() => carouselStore.goPrev());
}

function onDotClick(targetId: CarouselCardConfig["id"]) {
	if (targetId === carouselStore.activeCardId) return;
	const currentIndex = carouselStore.cards.findIndex(
		(card) => card.id === carouselStore.activeCardId,
	);
	const targetIndex = carouselStore.cards.findIndex((card) => card.id === targetId);
	if (targetIndex === -1 || currentIndex === -1) return;

	slideDirection.value = targetIndex > currentIndex ? "slide-left" : "slide-right";
	withAnimationLock(() => carouselStore.setActiveCard(targetId));
}

function onCardClick(role: "left" | "active" | "right") {
	if (role === "left") goPrevWithAnimation();
	if (role === "right") goNextWithAnimation();
}

// Swipe / pointer
let startX = 0;
let startY = 0;
let canSwipe = false;

function isSwipeBlockedTarget(target: EventTarget | null) {
	if (!(target instanceof Element)) return false;
	return Boolean(
		target.closest(
			"button, input, textarea, select, label, a, [role='button'], [role='switch'], .p-button, .p-inputtext, .td-list, .td-add-row, .td-dialog, .p-dialog",
		),
	);
}

function onPointerDown(e: PointerEvent) {
	canSwipe = !isSwipeBlockedTarget(e.target);
	if (!canSwipe) {
		startX = 0;
		startY = 0;
		return;
	}
	startX = e.clientX;
	startY = e.clientY;
}

function onPointerUp(e: PointerEvent) {
	if (!canSwipe) return;
	if (!Number.isFinite(startX) || !Number.isFinite(startY)) return;

	const deltaX = e.clientX - startX;
	const deltaY = e.clientY - startY;
	const absX = Math.abs(deltaX);
	const absY = Math.abs(deltaY);

	if (absX < SWIPE_THRESHOLD) return;
	if (absX < absY * SWIPE_DIRECTION_RATIO) return;

	if (deltaX < 0) goNextWithAnimation();
	else goPrevWithAnimation();
	canSwipe = false;
}

function onPointerCancel() {
	startX = 0;
	startY = 0;
	canSwipe = false;
}
</script>

<style scoped>
/* ====== SHARED DOTS ====== */
.carousel-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	margin-top: 10px;
}
@media (max-width: 640px) {
	.carousel-dots { display: none; }
}
.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: var(--p-orange-200);
	border: none;
	cursor: pointer;
	transition: transform 250ms ease, background-color 250ms ease, box-shadow 250ms ease;
}
:where(.my-app-dark, .my-app-dark *) .dot { background-color: var(--p-gray-600); }
.dot.active {
	background-color: var(--p-orange-400);
	transform: scale(1.6);
	box-shadow: 0 0 8px color-mix(in srgb, var(--p-orange-400) 40%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .dot.active {
	background-color: var(--p-orange-500);
	box-shadow: 0 0 8px color-mix(in srgb, var(--p-orange-500) 30%, transparent);
}

/* ====== DESKTOP CAROUSEL (hidden on mobile) ====== */
.desktop-carousel {
	position: relative;
	width: 100%;
	height: 80vh;
	max-height: 80vh;
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
	top: 45%;
	left: 50%;
	height: 80%;
	max-height: 80vh;
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
	filter: saturate(0.92);
	z-index: 2;
	cursor: pointer;
}
.role-right {
	transform: translate(calc(-50% + var(--carousel-side-offset)), -50%) scale(var(--carousel-side-scale));
	opacity: var(--carousel-side-opacity);
	filter: saturate(0.92);
	z-index: 2;
	cursor: pointer;
}

/* ====== MOBILE CAROUSEL (hidden on desktop) ====== */
.mobile-carousel {
	display: none;
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
@media (max-width: 640px) {
	.desktop-carousel { display: none; }
	.mobile-carousel  { display: flex; flex-direction: column; flex: 1; min-height: 0; }
	.mobile-track { flex: 1; min-height: 0; }
}
</style>
