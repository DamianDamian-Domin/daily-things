<template>
	<div
		class="flex flex-col gap-2 items-center flex-grow min-h-0 sm:gap-2 px-0 sm:px-0 w-full"
		@touchstart.passive="onTouchStart"
		@touchmove.passive="onTouchMove"
		@touchend.passive="onTouchEnd"
		@touchcancel="resetSwipeState">
		<div
			class="w-full px-3 pt-2 sm:px-0 sm:pt-0 flex items-center justify-center relative min-h-[2rem]">
			<div class="sm:hidden absolute left-3 shrink-0">
				<img
					src="@/assets/logo.png"
					alt="Daily Things"
					class="w-8 h-8 object-contain" />
			</div>

			<DatePicker class="shrink-0"></DatePicker>
		</div>

		<CarouselView class="flex-1 min-h-0 w-full" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHabbitsStore } from "../stores/habbits";
import { useCarouselStore } from "@/stores/useCarouselStore";
import DatePicker from "@/components/home_view/DatePicker.vue";
import CarouselView from "./CarouselView.vue";

const habbitsStore = useHabbitsStore();
const carouselStore = useCarouselStore();

const MOBILE_BREAKPOINT = 640;
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
	return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
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

onMounted(() => {
	habbitsStore.getDailyHabbitsInRange();
	habbitsStore.loadDailyGoals();
	habbitsStore.loadRecentHabbits();
});
</script>

<style scoped></style>
