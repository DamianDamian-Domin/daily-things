<template>
	<div class="carousel-view">
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
import ManageCard from "../components/home_view/ManageCard.vue";
import TextAddCard from "../components/home_view/TextAddCard.vue";
import StatsCard from "../components/home_view/StatsCard.vue";

const carouselStore = useCarouselStore();

/**
 * Mapujemy ID karty → komponent
 * Dzięki temu CarouselView:
 * - nie zna szczegółów kart
 * - tylko je renderuje
 */
// Używamy `as const`, żeby TS traktował wartości jako stringi dosłowne, a nie ogólne stringi
const cardComponentMap = {
	manage: ManageCard,
	textAdd: TextAddCard,
	stats: StatsCard,
} as const;

/**
 * Tworzymy listę kart do renderu:
 * - left
 * - active
 * - right
 * (null pomijamy)
 */
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

/**
 * Obsługa kliknięcia w kartę
 */
function onCardClick(role: "left" | "active" | "right") {
	if (role === "left") carouselStore.goPrev();
	if (role === "right") carouselStore.goNext();
	// klik w active → nic nie robimy
}
</script>

<style scoped>
.carousel-view {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
}

/* Tymczasowe style tylko do wizualnego testu */
.carousel-card {
	border: 1px dashed #999;
	padding: 16px;
	min-width: 200px;
	cursor: pointer;
}

.role-active {
	border-color: green;
}

.role-left,
.role-right {
	opacity: 0.5;
}
</style>
