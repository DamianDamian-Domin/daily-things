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
				:class="[`role-${item.role}`, { 'is-hinted': hintedRole === item.role }]"
				@click="onCardClick(item.role)">
				<!-- inert na środku karty, nie na niej samej: zawartość bocznej karty
				     jest nieaktywna, ale kliknięcie w kartę przełącza karuzelę -->
				<div
					class="carousel-card-inner"
					:inert="item.role !== 'active' || undefined">
					<component
						:is="cardComponentMap[item.card.id]"
						:isActive="item.role === 'active'" />
				</div>
				<!-- Podpowiedź po najechaniu: dokąd zabierze kliknięcie (klawiatura ma .side-hit) -->
				<span
					v-if="item.role !== 'active'"
					class="side-hint"
					aria-hidden="true">
					<i
						v-if="item.role === 'left'"
						class="pi pi-chevron-left"></i>
					{{ cardLabels[item.card.id] }}
					<i
						v-if="item.role === 'right'"
						class="pi pi-chevron-right"></i>
				</span>
			</div>
			<button
				v-if="carouselStore.leftCard"
				type="button"
				class="side-hit side-left"
				:aria-label="`Show ${cardLabels[carouselStore.leftCard.id]}`"
				@click="goPrevWithAnimation"
				@pointerenter="onHitEnter('left', $event)"
				@pointerleave="hitHover = null"
				@focus="hitFocus = 'left'"
				@blur="hitFocus = null">
				<i
					class="pi pi-chevron-left"
					aria-hidden="true"></i>
			</button>
			<button
				v-if="carouselStore.rightCard"
				type="button"
				class="side-hit side-right"
				:aria-label="`Show ${cardLabels[carouselStore.rightCard.id]}`"
				@click="goNextWithAnimation"
				@pointerenter="onHitEnter('right', $event)"
				@pointerleave="hitHover = null"
				@focus="hitFocus = 'right'"
				@blur="hitFocus = null">
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
import HabitsCard from "@/components/home_view/HabitsCard.vue";
// Karta Znajomi w osobnym pliku JS — pobierana dopiero, gdy ma się pokazać
import { defineAsyncComponent } from "vue";
const FriendsCard = defineAsyncComponent(() => import("@/components/home_view/FriendsCard.vue"));

const carouselStore = useCarouselStore();
const { isMobile } = useLayout();
const TRANSITION_DURATION_MS = 420;

const isAnimating = ref(false);

const cardComponentMap = {
	manage: HabitsCard,
	textAdd: ToDosCard,
	stats: StatsCard,
	friends: FriendsCard,
} as const;

const cardLabels: Record<CarouselCardConfig["id"], string> = {
	textAdd: "To-do list",
	manage: "Today's habits",
	stats: "Progress",
	friends: "Friends",
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

// Boczna karta „wychyla się” także, gdy kursor jest nad jej przyciskiem
// (pas przy krawędzi ekranu) albo przycisk ma fokus z klawiatury
const hitHover = ref<CarouselRole | null>(null);
const hitFocus = ref<CarouselRole | null>(null);
const hintedRole = computed(() => hitFocus.value ?? hitHover.value);

function onHitEnter(role: CarouselRole, event: PointerEvent) {
	if (event.pointerType === "mouse") hitHover.value = role;
}

// Kliknięcie w widoczną część bocznej karty przenosi ją na środek
function onCardClick(role: CarouselRole) {
	if (role === "left") goPrevWithAnimation();
	else if (role === "right") goNextWithAnimation();
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
@media (hover: hover) {
	.dot:not(.active):hover::before {
		background-color: var(--dt-hover-border);
		transform: scale(1.3);
	}
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
	--carousel-peek: 0px;
	position: absolute;
	top: 50%;
	left: 50%;
	height: 94%;
	max-height: 50rem;
	display: flex;
	align-items: stretch;
	justify-content: center;
	will-change: transform;
	backface-visibility: hidden;
	transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
.role-active {
	transform: translate(-50%, -50%) scale(1);
	z-index: 3;
}
/* Przygaszamy tylko zawartość — podpowiedź na karcie zostaje wyraźna */
.carousel-card-inner {
	display: flex;
	align-items: stretch;
	height: 100%;
	transition:
		opacity 320ms ease,
		filter 320ms ease;
}
.role-left,
.role-right {
	cursor: pointer;
}
.role-left .carousel-card-inner,
.role-right .carousel-card-inner {
	opacity: var(--carousel-side-opacity);
	filter: saturate(0.9);
}
.role-left {
	transform: translate(calc(-50% - var(--carousel-side-offset) + var(--carousel-peek)), -50%)
		scale(var(--carousel-side-scale));
	z-index: 2;
}
.role-right {
	transform: translate(calc(-50% + var(--carousel-side-offset) - var(--carousel-peek)), -50%)
		scale(var(--carousel-side-scale));
	z-index: 2;
}
/* Najechanie na boczną kartę: rozjaśnia się i lekko „wychyla” w stronę środka.
   --dt-lift = 0 przy ograniczonym ruchu, więc wtedy tylko się rozjaśnia. */
.carousel-card.is-hinted {
	--carousel-side-opacity: 0.88;
	--carousel-peek: calc(var(--dt-lift) * -7);
}
.is-hinted .carousel-card-inner {
	filter: saturate(1);
}
@media (hover: hover) {
	.role-left:hover,
	.role-right:hover {
		--carousel-side-opacity: 0.88;
		--carousel-peek: calc(var(--dt-lift) * -7);
	}
	.role-left:hover .carousel-card-inner,
	.role-right:hover .carousel-card-inner {
		filter: saturate(1);
	}
}

/* „‹ To-do list” / „Progress ›” na widocznym brzegu bocznej karty */
.side-hint {
	--hint-shift: 0px;
	position: absolute;
	top: 50%;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.55rem 1rem;
	border-radius: var(--dt-radius-pill);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	box-shadow: var(--dt-shadow);
	color: var(--dt-accent-ink);
	font-size: var(--dt-text-sm);
	font-weight: 700;
	white-space: nowrap;
	pointer-events: none;
	opacity: 0;
	transform: translate(var(--hint-shift), -50%);
	transition:
		opacity 0.2s ease,
		transform 0.3s var(--dt-ease);
}
.side-hint i {
	font-size: 0.7rem;
}
.role-left .side-hint {
	left: 1.25rem;
	--hint-shift: calc(var(--dt-lift) * -3);
}
.role-right .side-hint {
	right: 1.25rem;
	--hint-shift: calc(var(--dt-lift) * 3);
}
.is-hinted .side-hint {
	opacity: 1;
	--hint-shift: 0px;
}
@media (hover: hover) {
	.role-left:hover .side-hint,
	.role-right:hover .side-hint {
		opacity: 1;
		--hint-shift: 0px;
	}
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
	color: var(--dt-accent-ink);
	opacity: 0;
	transition: opacity 0.2s ease;
}
/* Fokus z klawiatury widać na kółku ze strzałką, nie na całym wysokim pasie */
.side-hit:focus-visible {
	outline: none;
}
.side-hit:focus-visible i {
	opacity: 1;
	outline: 2px solid var(--dt-focus);
	outline-offset: 2px;
}
@media (hover: hover) {
	.side-hit:hover i {
		opacity: 1;
	}
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
	.carousel-card-inner,
	.side-hint,
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
