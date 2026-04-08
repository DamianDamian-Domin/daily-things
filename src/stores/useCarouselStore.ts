import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { CarouselCardConfig } from "../libs/types";

export const useCarouselStore = defineStore("carouselStore", () => {
	// ZMIANA 1: Zrobiliśmy z tablicy ref(), aby móc dynamicznie modyfikować pole 'order'
	const carouselCards = ref<CarouselCardConfig[]>([
		{ id: "manage", order: 2 },
		{ id: "textAdd", order: 1 },
		{ id: "stats", order: 3 },
	]);

	// Aktywne ID karty
	const activeCardId = ref<CarouselCardConfig["id"]>("manage");

	// 1. Sortowanie kart według 'order'
	const orderedCards = computed(() =>
		[...carouselCards.value].sort((a, b) => a.order - b.order),
	);

	// 2. Pobieranie indeksu aktywnej karty
	const activeIndex = computed(() =>
		orderedCards.value.findIndex((c) => c.id === activeCardId.value),
	);

	// 3. Widoki kart
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

	// --- Akcje (Actions) ---

	// ZMIANA 2: Główna logika Swap (zamiany miejsc)
	function setActiveCard(targetId: CarouselCardConfig["id"]) {
		// Jeśli kliknięto kartę, która już jest aktywna, nic nie rób
		if (activeCardId.value === targetId) return;

		// Znajdujemy obie karty (klikniętą oraz obecnie aktywną)
		const targetCard = carouselCards.value.find((c) => c.id === targetId);
		const currentActiveCard = carouselCards.value.find(
			(c) => c.id === activeCardId.value,
		);

		if (targetCard && currentActiveCard) {
			// Zamieniamy je miejscami wymieniając ich 'order'
			const tempOrder = currentActiveCard.order;
			currentActiveCard.order = targetCard.order;
			targetCard.order = tempOrder;
		}

		// Aktualizujemy ID
		activeCardId.value = targetId;
	}

	// ZMIANA 3: Używamy nowej funkcji setActiveCard w goNext i goPrev, aby wymusić Swap przy przesuwaniu palcem
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
		// Przywracamy domyślne ułożenie kart
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
		cards: orderedCards, // Używamy posortowanych kart do kropek pod karuzelą
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
