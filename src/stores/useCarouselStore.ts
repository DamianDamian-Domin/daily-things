import { ref, computed } from "vue";
import { defineStore } from "pinia";

import type { CarouselCardConfig } from "../libs/types";

export const useCarouselStore = defineStore("carouselStore", () => {
	const carouselCards: CarouselCardConfig[] = [
		{ id: "manage", order: 2 },
		{ id: "textAdd", order: 1 },
		{ id: "stats", order: 3 },
	];
	// Active card ID
	const activeCardId = ref<CarouselCardConfig["id"]>("manage");

	// Computed properties
	const orderedCards = computed(() =>
		carouselCards.slice().sort((a, b) => a.order - b.order),
	);
	// Currently active card
	const activeCard = computed(
		() => orderedCards.value.find((c) => c.id === activeCardId.value) ?? null,
	);
	// Index of the active card
	const activeIndex = computed(() =>
		orderedCards.value.findIndex((c) => c.id === activeCardId.value),
	);

	// Left and right cards relative to the active card

	const leftCard = computed(() => {
		if (activeIndex.value <= 0) return null;
		return orderedCards.value[activeIndex.value - 1];
	});

	// Right card relative to the active card
	const rightCard = computed(() => {
		if (activeIndex.value === -1) return null;
		return orderedCards.value[activeIndex.value + 1] ?? null;
	});

	// Actions to manipulate the carousel
	function setActiveCard(id: CarouselCardConfig["id"]) {
		if (!orderedCards.value.some((c) => c.id === id)) return;
		activeCardId.value = id;
	}

	// Navigate to the next card
	function goNext() {
		if (!rightCard.value) return;
		activeCardId.value = rightCard.value.id;
	}

	// Navigate to the previous card
	function goPrev() {
		if (!leftCard.value) return;
		activeCardId.value = leftCard.value.id;
	}

	// Reset to the first card
	function reset() {
		activeCardId.value = orderedCards.value[0]?.id;
	}

	return {
		cards: orderedCards,
		activeCardId,

		activeCard,
		leftCard,
		rightCard,

		setActiveCard,
		goNext,
		goPrev,
		reset,
	};
});
