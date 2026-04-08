<template>
	<div class="carousel-dots">
		<button
			v-for="(card, index) in carouselStore.cards"
			:key="card.id"
			class="dot"
			:class="{ active: card.id === carouselStore.activeCardId }"
			:aria-label="`Przejdź do karty ${index + 1}`"
			@click="carouselStore.setActiveCard(card.id)" />
	</div>
	<div
		class="carousel-view"
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
</template>

<script setup lang="ts">
import type { CarouselCardConfig } from "@/libs/types";
type CarouselRole = "left" | "active" | "right";
type VisibleCarouselCard = {
	role: CarouselRole;
	card: CarouselCardConfig;
};
import { computed } from "vue";
import { useCarouselStore } from "@/stores/useCarouselStore";

// Karty
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
	if (role === "left") carouselStore.goPrev();
	if (role === "right") carouselStore.goNext();
	// klik w active → nic nie robimy
}

let startX = 0;
const SWIPE_THRESHOLD = 40;

function onPointerDown(e: PointerEvent) {
	startX = e.clientX;
}

function onPointerUp(e: PointerEvent) {
	const deltaX = e.clientX - startX;

	if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

	if (deltaX < 0) {
		// swipe w lewo
		carouselStore.goNext();
	} else {
		// swipe w prawo
		carouselStore.goPrev();
	}
}
</script>

<style scoped>
.carousel-view {
	position: relative;
	width: 100%;
	height: 80vh;
	max-height: 80vh;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

/* Baza karty */
.carousel-card {
	position: absolute;
	top: 45%;
	left: 50%;
	display: flex;
	align-items: stretch;
	justify-content: center;
	will-change: transform, opacity, z-index;
}

/* === ANIMACJE (KEYFRAMES) === */

/* Karta wchodzi na środek (staje się aktywna) */
@keyframes slide-to-active {
	0% {
		transform: translate(-50%, -50%) scale(0.85);
		z-index: 2;
		opacity: 0.4;
	}
	50% {
		transform: translate(calc(-50% + 100px), -50%) scale(0.9);
	} /* Lekki zamach w bok */
	100% {
		transform: translate(-50%, -50%) scale(1);
		z-index: 3;
		opacity: 1;
	}
}

/* Karta ucieka na lewo */
@keyframes slide-to-left {
	0% {
		transform: translate(-50%, -50%) scale(1);
		z-index: 3;
		opacity: 1;
	}
	50% {
		transform: translate(calc(-50% - 350px), -50%) scale(0.9);
	} /* Wychylenie mocniej w lewo */
	100% {
		transform: translate(calc(-50% - 280px), -50%) scale(0.85);
		z-index: 2;
		opacity: 0.4;
	}
}

/* Karta ucieka na prawo */
@keyframes slide-to-right {
	0% {
		transform: translate(-50%, -50%) scale(1);
		z-index: 3;
		opacity: 1;
	}
	50% {
		transform: translate(calc(-50% + 350px), -50%) scale(0.9);
	} /* Wychylenie mocniej w prawo */
	100% {
		transform: translate(calc(-50% + 280px), -50%) scale(0.85);
		z-index: 2;
		opacity: 0.4;
	}
}

/* === PRZYPISANIE ANIMACJI DO RÓL === */

.role-active {
	animation: slide-to-active 0.8s ease-out forwards;
}

.role-left {
	animation: slide-to-left 0.8s ease-out forwards;
	cursor: pointer;
}

.role-right {
	animation: slide-to-right 0.8s ease-out forwards;
	cursor: pointer;
}

/* DOTS — ciepły, zaokrąglony styl */
.carousel-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	margin-top: 10px;
}

.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: var(--p-orange-200);
	border: none;
	cursor: pointer;
	transition:
		transform 250ms ease,
		background-color 250ms ease,
		box-shadow 250ms ease;
}

:where(.my-app-dark, .my-app-dark *) .dot {
	background-color: var(--p-gray-600);
}

.dot.active {
	background-color: var(--p-orange-400);
	transform: scale(1.6);
	box-shadow: 0 0 8px color-mix(in srgb, var(--p-orange-400) 40%, transparent);
}

:where(.my-app-dark, .my-app-dark *) .dot.active {
	background-color: var(--p-orange-500);
	box-shadow: 0 0 8px color-mix(in srgb, var(--p-orange-500) 30%, transparent);
}
</style>
