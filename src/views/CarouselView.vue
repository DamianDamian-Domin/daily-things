<template>
	<!-- DOTS -->
	<div class="carousel-dots">
		<button
			v-for="(card, index) in carouselStore.cards"
			:key="card.id"
			class="dot"
			:class="{ active: card.id === carouselStore.activeCardId }"
			:aria-label="`Go to card ${index + 1}`"
			@click="carouselStore.setActiveCard(card.id)" />
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
		@touchstart.passive="onTouchStart"
		@touchend.passive="onTouchEnd">
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

function onCardClick(role: "left" | "active" | "right") {
	if (role === "left") { slideDirection.value = "slide-right"; carouselStore.goPrev(); }
	if (role === "right") { slideDirection.value = "slide-left"; carouselStore.goNext(); }
}

// Swipe / pointer
let startX = 0;
let startTouchX = 0;
const SWIPE_THRESHOLD = 40;
const slideDirection = ref<"slide-left" | "slide-right">("slide-left");

function onPointerDown(e: PointerEvent) { startX = e.clientX; }
function onPointerUp(e: PointerEvent) {
	const delta = e.clientX - startX;
	if (Math.abs(delta) < SWIPE_THRESHOLD) return;
	if (delta < 0) { slideDirection.value = "slide-left"; carouselStore.goNext(); }
	else { slideDirection.value = "slide-right"; carouselStore.goPrev(); }
}

function onTouchStart(e: TouchEvent) { startTouchX = e.touches[0].clientX; }
function onTouchEnd(e: TouchEvent) {
	const delta = e.changedTouches[0].clientX - startTouchX;
	if (Math.abs(delta) < SWIPE_THRESHOLD) return;
	if (delta < 0) { slideDirection.value = "slide-left"; carouselStore.goNext(); }
	else { slideDirection.value = "slide-right"; carouselStore.goPrev(); }
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
	will-change: transform, opacity, z-index;
}
@keyframes slide-to-active {
	0%   { transform: translate(-50%, -50%) scale(0.85); z-index: 2; opacity: 0.4; }
	50%  { transform: translate(calc(-50% + 100px), -50%) scale(0.9); }
	100% { transform: translate(-50%, -50%) scale(1); z-index: 3; opacity: 1; }
}
@keyframes slide-to-left {
	0%   { transform: translate(-50%, -50%) scale(1); z-index: 3; opacity: 1; }
	50%  { transform: translate(calc(-50% - 350px), -50%) scale(0.9); }
	100% { transform: translate(calc(-50% - 280px), -50%) scale(0.85); z-index: 2; opacity: 0.4; }
}
@keyframes slide-to-right {
	0%   { transform: translate(-50%, -50%) scale(1); z-index: 3; opacity: 1; }
	50%  { transform: translate(calc(-50% + 350px), -50%) scale(0.9); }
	100% { transform: translate(calc(-50% + 280px), -50%) scale(0.85); z-index: 2; opacity: 0.4; }
}
.role-active { animation: slide-to-active 0.8s ease-out forwards; }
.role-left   { animation: slide-to-left 0.8s ease-out forwards; cursor: pointer; }
.role-right  { animation: slide-to-right 0.8s ease-out forwards; cursor: pointer; }

/* ====== MOBILE CAROUSEL (hidden on desktop) ====== */
.mobile-carousel {
	display: none;
	position: relative;
	width: 100%;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
}
.mobile-track {
	width: 100%;
	position: relative;
}
.mobile-card {
	width: 100%;
	padding: 0 0.5rem 0.75rem;
}
.mobile-card > * { width: 100%; }

/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
	transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease;
}
.slide-left-enter-from  { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to    { transform: translateX(-100%); opacity: 0; }
.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to   { transform: translateX(100%); opacity: 0; }

/* ====== RESPONSIVE SWITCH ====== */
@media (max-width: 640px) {
	.desktop-carousel { display: none; }
	.mobile-carousel  { display: flex; flex-direction: column; }
}
</style>
