<template>
	<div
		class="home"
		@touchstart.passive="onTouchStart"
		@touchmove.passive="onTouchMove"
		@touchend.passive="onTouchEnd"
		@touchcancel="resetSwipeState">
		<h1 class="sr-only">Daily Things — habits and to-dos</h1>
		<div class="home-top">
			<img
				src="@/assets/logo.png"
				alt=""
				width="36"
				height="36"
				class="home-logo" />
			<DatePicker v-if="showDatePicker" />
			<p
				v-else
				class="home-wordmark"
				aria-hidden="true">
				Daily Things
			</p>
		</div>

		<CarouselView class="home-carousel" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useLayout } from "@/utils/useLayout";
import { useCarouselStore } from "@/stores/useCarouselStore";
import DatePicker from "@/components/home_view/DatePicker.vue";
import CarouselView from "./CarouselView.vue";

const carouselStore = useCarouselStore();

const { isMobile } = useLayout();
const SWIPE_THRESHOLD = 34;
const SWIPE_DIRECTION_RATIO = 1.05;
const TRANSITION_DURATION_MS = 420;

const isAnimating = ref(false);

let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let canSwipe = false;

function isMobileSwipeEnabled() {
	return isMobile.value;
}

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

function isSwipeBlockedTarget(target: EventTarget | null) {
	if (!(target instanceof Element)) return false;
	return Boolean(
		target.closest(
			"button, a, input, textarea, select, label, [contenteditable='true'], [role='button'], [role='switch'], .p-button, .p-inputtext, .td-dialog, .p-dialog",
		),
	);
}

function beginSwipeTracking(clientX: number, clientY: number) {
	startX = clientX;
	startY = clientY;
	lastX = clientX;
	lastY = clientY;
}

function updateSwipeTracking(clientX: number, clientY: number) {
	lastX = clientX;
	lastY = clientY;
}

function resetSwipeState() {
	startX = 0;
	startY = 0;
	lastX = 0;
	lastY = 0;
	canSwipe = false;
}

function finishSwipe(clientX: number, clientY: number) {
	if (!canSwipe || isAnimating.value) {
		resetSwipeState();
		return;
	}

	const endX = Number.isFinite(lastX) ? lastX : clientX;
	const endY = Number.isFinite(lastY) ? lastY : clientY;
	const deltaX = endX - startX;
	const deltaY = endY - startY;
	const absX = Math.abs(deltaX);
	const absY = Math.abs(deltaY);

	if (absX < SWIPE_THRESHOLD || absX < absY * SWIPE_DIRECTION_RATIO) {
		resetSwipeState();
		return;
	}

	if (deltaX < 0) goNextWithAnimation();
	else goPrevWithAnimation();
	resetSwipeState();
}

function onTouchStart(event: TouchEvent) {
	if (!isMobileSwipeEnabled() || isAnimating.value) {
		resetSwipeState();
		return;
	}
	canSwipe = !isSwipeBlockedTarget(event.target);
	if (!canSwipe) {
		resetSwipeState();
		return;
	}
	const touch = event.touches[0];
	if (!touch) {
		resetSwipeState();
		return;
	}
	beginSwipeTracking(touch.clientX, touch.clientY);
}

function onTouchMove(event: TouchEvent) {
	if (!canSwipe) return;
	const touch = event.touches[0];
	if (!touch) return;
	updateSwipeTracking(touch.clientX, touch.clientY);
}

function onTouchEnd(event: TouchEvent) {
	const touch = event.changedTouches[0];
	if (!touch) {
		resetSwipeState();
		return;
	}
	finishSwipe(touch.clientX, touch.clientY);
}

// Na mobile data ma sens tylko na karcie habitów; na desktopie widać wszystkie karty
const showDatePicker = computed(() => !isMobile.value || carouselStore.activeCardId === "manage");
</script>

<style scoped>
.home {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
	min-height: 0;
	width: 100%;
	gap: 0.25rem;
}
.home-top {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: 3.25rem;
	padding: 0.5rem 0.75rem 0;
}
.home-logo {
	display: none;
	position: absolute;
	left: 0.75rem;
	width: 2.25rem;
	height: 2.25rem;
	object-fit: contain;
}
.home-wordmark {
	margin: 0;
	font-family: var(--dt-font-script);
	font-size: 1.9rem;
	line-height: 1;
	color: var(--dt-text-2);
}
.home-carousel {
	flex: 1;
	min-height: 0;
	width: 100%;
}
@media (max-width: 640px) {
	.home-logo {
		display: block;
	}
}
</style>
