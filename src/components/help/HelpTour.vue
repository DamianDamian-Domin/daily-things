<template>
	<Dialog
		v-model:visible="visible"
		modal
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'help-title', 'aria-roledescription': 'carousel' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog help-dialog">
		<div
			class="help"
			@keydown.left.prevent="go(index - 1)"
			@keydown.right.prevent="go(index + 1)">
			<div class="help-top">
				<span class="help-step">{{ index + 1 }} / {{ HELP_SLIDES.length }}</span>
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Close help"
					@click="visible = false">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>

			<div
				class="help-viewport"
				@pointerdown="onPointerDown"
				@pointerup="onPointerUp"
				@pointercancel="startX = null">
				<div
					class="help-track"
					:style="{ transform: `translateX(-${index * 100}%)` }">
					<section
						v-for="(slide, i) in HELP_SLIDES"
						:id="`help-slide-${slide.id}`"
						:key="slide.id"
						class="help-slide"
						role="group"
						aria-roledescription="slide"
						:aria-label="`${i + 1} of ${HELP_SLIDES.length}`"
						:aria-hidden="i !== index"
						:inert="i !== index">
						<HelpIllustration :slide="slide.id" />
						<h2
							:id="i === index ? 'help-title' : undefined"
							class="dt-title help-title">
							{{ slide.title }}
						</h2>
						<p class="help-text">{{ slide.text }}</p>
					</section>
				</div>
			</div>

			<div
				class="help-dots"
				role="tablist"
				aria-label="Choose a page">
				<button
					v-for="(slide, i) in HELP_SLIDES"
					:key="slide.id"
					type="button"
					role="tab"
					class="help-dot"
					:class="{ active: i === index }"
					:aria-selected="i === index"
					:aria-controls="`help-slide-${slide.id}`"
					:aria-label="slide.title"
					@click="go(i)"></button>
			</div>

			<div class="help-actions">
				<button
					v-if="index > 0"
					type="button"
					class="dt-btn dt-btn-ghost"
					@click="go(index - 1)">
					Back
				</button>
				<button
					v-else
					type="button"
					class="dt-btn dt-btn-ghost"
					@click="visible = false">
					Skip
				</button>
				<button
					v-if="!isLast"
					type="button"
					class="dt-btn dt-btn-primary"
					@click="go(index + 1)">
					Next
					<i
						class="pi pi-arrow-right"
						aria-hidden="true"></i>
				</button>
				<button
					v-else
					type="button"
					class="dt-btn dt-btn-primary"
					@click="visible = false">
					Let's go
				</button>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import HelpIllustration from "./HelpIllustration.vue";
import { HELP_SLIDES } from "@/utils/onboarding";

const visible = defineModel<boolean>({ default: false });
const index = ref(0);
const isLast = computed(() => index.value === HELP_SLIDES.length - 1);

// Każde otwarcie zaczyna od pierwszej strony
watch(visible, (open) => {
	if (open) index.value = 0;
});

function go(i: number) {
	index.value = Math.min(Math.max(i, 0), HELP_SLIDES.length - 1);
}

// Przesuwanie palcem między stronami
const startX = ref<number | null>(null);
function onPointerDown(e: PointerEvent) {
	if (e.pointerType !== "mouse") startX.value = e.clientX;
}
function onPointerUp(e: PointerEvent) {
	if (startX.value === null) return;
	const dx = e.clientX - startX.value;
	startX.value = null;
	if (Math.abs(dx) > 40) go(index.value + (dx < 0 ? 1 : -1));
}
</script>

<style scoped>
.help {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	max-height: min(92dvh, 40rem);
	padding: 0.9rem 1.25rem 1.25rem;
	overflow-y: auto;
}
.help-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.help-step {
	font-size: var(--dt-text-xs);
	font-weight: 700;
	letter-spacing: 0.08em;
	color: var(--dt-text-3);
}
.help-viewport {
	overflow: hidden;
	touch-action: pan-y;
}
.help-track {
	display: flex;
	transition: transform 0.35s var(--dt-ease);
}
.help-slide {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	flex: 0 0 100%;
	min-width: 0;
	text-align: center;
}
.help-title {
	margin-top: 0.5rem;
}
.help-text {
	margin: 0 auto;
	max-width: 26rem;
	font-size: var(--dt-text-md);
	line-height: 1.5;
	color: var(--dt-text-2);
}
.help-dots {
	display: flex;
	justify-content: center;
	gap: 0.15rem;
}
.help-dot {
	position: relative;
	width: 1.5rem;
	height: 1.5rem;
	border: none;
	background: transparent;
	cursor: pointer;
}
.help-dot::after {
	content: "";
	position: absolute;
	inset: 50% auto auto 50%;
	width: 0.5rem;
	height: 0.5rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-border-strong);
	transform: translate(-50%, -50%);
	transition:
		width 0.25s var(--dt-ease),
		background-color 0.25s ease;
}
.help-dot.active::after {
	width: 1.2rem;
	background: var(--dt-accent);
}
.help-actions {
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
}
.help-actions .dt-btn-primary {
	min-width: 8rem;
}
</style>

<style>
.help-dialog.p-dialog {
	width: min(94vw, 30rem);
}
</style>
