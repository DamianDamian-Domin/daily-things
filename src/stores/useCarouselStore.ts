import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { CarouselCardConfig } from "../libs/types";

export const useCarouselStore = defineStore("carouselStore", () => {
	// CHANGE 1: Use ref() for array to allow dynamic updates of 'order'
	const carouselCards = ref<CarouselCardConfig[]>([
		{ id: "manage", order: 2 },
		{ id: "textAdd", order: 1 },
		{ id: "stats", order: 3 },
	]);

	// Active card ID
	const activeCardId = ref<CarouselCardConfig["id"]>("manage");

	// 1. Sort cards by 'order'
	const orderedCards = computed(() =>
		[...carouselCards.value].sort((a, b) => a.order - b.order),
	);

	// 2. Get active card index
	const activeIndex = computed(() =>
		orderedCards.value.findIndex((c) => c.id === activeCardId.value),
	);

	// 3. Card views
	const activeCard = computed(() => orderedCards.value[activeIndex.value]);

	const leftCard = computed(() => {
		const len = orderedCards.value.length;
		if (len === 0) return null;
		const prevIdx = (activeIndex.value - 1 + len) % len;
		return orderedCards.value[prevIdx];
	});

	const rightCard = computed(() => {
		const len = orderedCards.value.length;
		if (len === 0) return null;
		const nextIdx = (activeIndex.value + 1) % len;
		return orderedCards.value[nextIdx];
	});

	// --- Actions ---

	// CHANGE 2: Main swap logic
	function setActiveCard(targetId: CarouselCardConfig["id"]) {
		// If clicked card is already active, do nothing
		if (activeCardId.value === targetId) return;

		// Find both cards (clicked and currently active)
		const targetCard = carouselCards.value.find((c) => c.id === targetId);
		const currentActiveCard = carouselCards.value.find(
			(c) => c.id === activeCardId.value,
		);

		if (targetCard && currentActiveCard) {
			// Swap them by exchanging their 'order'
			const tempOrder = currentActiveCard.order;
			currentActiveCard.order = targetCard.order;
			targetCard.order = tempOrder;
		}

		// Update active ID
		activeCardId.value = targetId;
	}

	// CHANGE 3: Use setActiveCard in goNext/goPrev to force swap on swipe
	function goNext() {
		if (rightCard.value) {
			setActiveCard(rightCard.value.id);
		}
	}

	function goPrev() {
		if (leftCard.value) {
			setActiveCard(leftCard.value.id);
		}
	}

	function reset() {
		// Restore default card order
		const defaultOrders: Record<string, number> = {
			manage: 2,
			textAdd: 1,
			stats: 3,
		};
		carouselCards.value.forEach((card) => {
			card.order = defaultOrders[card.id];
		});
		activeCardId.value = "manage";
	}

	return {
		cards: orderedCards, // Use sorted cards for carousel dots
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
