import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { CarouselCardConfig } from "../libs/types";

export const useCarouselStore = defineStore("carouselStore", () => {
	const cards: CarouselCardConfig[] = [
		{ id: "textAdd", order: 1 },
		{ id: "manage", order: 2 },
		{ id: "stats", order: 3 },
	];

	const activeIndex = ref(1); // domyślnie "manage" (środkowa)

	const activeCardId = computed(() => cards[activeIndex.value].id);
	const activeCard = computed(() => cards[activeIndex.value]);
	const leftCard = computed(() => activeIndex.value > 0 ? cards[activeIndex.value - 1] : null);
	const rightCard = computed(() => activeIndex.value < cards.length - 1 ? cards[activeIndex.value + 1] : null);

	function setActiveCard(targetId: CarouselCardConfig["id"]) {
		const idx = cards.findIndex((c) => c.id === targetId);
		if (idx !== -1) activeIndex.value = idx;
	}

	function goNext() {
		if (activeIndex.value < cards.length - 1) activeIndex.value++;
	}

	function goPrev() {
		if (activeIndex.value > 0) activeIndex.value--;
	}

	function reset() {
		activeIndex.value = 1;
	}

	return {
		cards,
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
