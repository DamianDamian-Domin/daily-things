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
import TextAddCard from "../components/home_view/TextAddCard.vue";
import StatsCard from "../components/home_view/StatsCard.vue";
import HabbitsCard from "@/components/home_view/HabbitsCard.vue";

const carouselStore = useCarouselStore();

const cardComponentMap = {
	manage: HabbitsCard,
	textAdd: TextAddCard,
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
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 4px;

	/* KLUCZOWE DLA rotateY */
	perspective: 1200px;
	touch-action: pan-y;
}

/* BAZA KARTY */
.carousel-card {
	will-change: transform, opacity;
	transform-style: preserve-3d;
	transition:
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 320ms ease;
	box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

/* ===== ROLA: ACTIVE (ŚRODEK) ===== */
.role-active {
	transform: translateX(0) scale(1) rotateY(0deg);
	opacity: 1;
	z-index: 3;
	cursor: default;
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
}

/* ===== ROLA: LEFT ===== */
.role-left {
	transform: translateX(-20%) scale(0.9) rotateY(-25deg);
}

/* ===== ROLA: RIGHT ===== */
.role-right {
	transform: translateX(20%) scale(0.9) rotateY(25deg);
}
.role-left,
.role-right {
	cursor: pointer;
	opacity: 0.6;
	z-index: 2;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.carousel-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	margin-top: 14px;
}

/* baza kropki */
.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: #cbd5e1;
	border: none;
	padding: 0;
	cursor: pointer;

	transition:
		transform 200ms ease,
		background-color 200ms ease,
		opacity 200ms ease;
}

/* hover – tylko wizualny hint */
.dot:hover {
	opacity: 0.8;
}

/* aktywna karta */
.dot.active {
	background-color: var(--color-green-500); /* zielony akcent */
	transform: scale(1.5);
}

/* focus (klawiatura) */
.dot:focus-visible {
	outline: none;
	box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
}
</style>
