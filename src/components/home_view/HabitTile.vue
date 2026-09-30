<template>
	<button
		type="button"
		class="tile"
		:class="[
			`size-${size}`,
			{
				'is-muted': muted,
				'is-negative': negative,
				'is-done': done,
				'is-selected': selected,
				'is-bouncing': bouncing,
				'has-label': showLabel,
			},
		]"
		:style="{ '--tint': tint, '--tint-strong': tintStrong }"
		:aria-label="ariaLabel || label"
		:aria-pressed="pressed"
		v-tooltip.bottom="tooltip && !showLabel && canHover ? label : undefined"
		@click="onClick">
		<span class="tile-face">
			<PixelIcon
				:icon="habbit.icon"
				:palette="palette"
				:muted="muted"
				:size="iconSize" />

			<span
				v-if="progress !== null"
				class="tile-progress"
				aria-hidden="true">
				<span :style="{ width: `${Math.min(progress, 1) * 100}%` }"></span>
			</span>

			<Transition name="tile-badge">
				<span
					v-if="badge"
					:key="badge"
					class="tile-badge"
					:class="{ 'is-check': badge === '✓' }"
					aria-hidden="true"
					>{{ badge }}</span
				>
			</Transition>
		</span>
		<span
			v-if="showLabel"
			class="tile-label"
			>{{ label }}</span
		>
	</button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Habbit } from "@/libs/types";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { PALETTES } from "@/utils/pixelIcons";
import { displayName, isNegative, paletteFor } from "@/utils/habitCatalog";

const props = withDefaults(
	defineProps<{
		habbit: Habbit;
		size?: "sm" | "md" | "lg";
		showLabel?: boolean;
		tooltip?: boolean;
		muted?: boolean;
		done?: boolean;
		selected?: boolean;
		badge?: string | null;
		progress?: number | null;
		ariaLabel?: string;
		pressed?: boolean;
	}>(),
	{
		size: "md",
		showLabel: false,
		tooltip: true,
		muted: false,
		done: false,
		selected: false,
		badge: null,
		progress: null,
		ariaLabel: undefined,
		pressed: undefined,
	},
);

const emit = defineEmits<{ (e: "click", event: MouseEvent): void }>();

const label = computed(() => displayName(props.habbit));
// Na ekranach dotykowych tooltip „przykleja się” po tapnięciu
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const negative = computed(() => isNegative(props.habbit));
const palette = computed(() => paletteFor(props.habbit));
const iconSize = computed(() => ({ sm: 26, md: 34, lg: 40 })[props.size]);
const tint = computed(() => PALETTES[palette.value].h);
const tintStrong = computed(() => PALETTES[palette.value].f);

// Krótkie „podskoczenie” po stuknięciu — natychmiastowa informacja zwrotna
const bouncing = ref(false);
function onClick(event: MouseEvent) {
	bouncing.value = false;
	requestAnimationFrame(() => {
		bouncing.value = true;
		setTimeout(() => (bouncing.value = false), 380);
	});
	emit("click", event);
}
</script>

<style scoped>
.tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	padding: 0;
	border: none;
	background: transparent;
	color: inherit;
	cursor: pointer;
	border-radius: var(--dt-radius);
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
}
.tile.has-label {
	width: 4.6rem;
}

.tile-face {
	position: relative;
	display: grid;
	place-items: center;
	width: 3.4rem;
	height: 3.4rem;
	border-radius: 1rem;
	background: color-mix(in srgb, var(--tint) 34%, var(--dt-surface));
	box-shadow:
		inset 0 -3px 0 color-mix(in srgb, var(--tint-strong) 22%, transparent),
		var(--dt-shadow-sm);
	transition:
		transform 0.22s var(--dt-spring),
		background-color 0.2s ease,
		box-shadow 0.2s ease;
}
.size-sm .tile-face {
	width: 2.7rem;
	height: 2.7rem;
	border-radius: 0.8rem;
}
.size-lg .tile-face {
	width: 3.9rem;
	height: 3.9rem;
	border-radius: 1.1rem;
}
:where(.my-app-dark) .tile-face {
	background: color-mix(in srgb, var(--tint-strong) 16%, var(--dt-surface));
}

.tile:hover .tile-face {
	transform: translateY(-2px);
	box-shadow:
		inset 0 -3px 0 color-mix(in srgb, var(--tint-strong) 30%, transparent),
		var(--dt-shadow);
}
.tile:active .tile-face {
	transform: scale(0.93);
}
.tile:focus-visible {
	box-shadow: none;
}
.tile:focus-visible .tile-face {
	box-shadow: var(--dt-focus-ring);
}

/* Cel jeszcze nie zrobiony — przerywana ramka, „duch” ikony */
.tile.is-muted .tile-face {
	background: var(--dt-surface-soft);
	box-shadow: inset 0 0 0 2px var(--dt-border-strong);
	background-image: none;
}
.tile.is-muted .tile-face::before {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	border: 2px dashed color-mix(in srgb, var(--tint-strong) 45%, var(--dt-border-strong));
}

.tile.is-done .tile-face {
	box-shadow:
		inset 0 0 0 2px color-mix(in srgb, var(--dt-success-fill) 70%, transparent),
		var(--dt-shadow-sm);
}

.tile.is-selected .tile-face {
	box-shadow:
		0 0 0 3px var(--dt-surface),
		0 0 0 5px var(--dt-accent);
}

.tile.is-negative .tile-face {
	background: color-mix(in srgb, var(--tint) 30%, var(--dt-surface));
}

/* Licznik / odznaczenie */
.tile-badge {
	position: absolute;
	top: -0.35rem;
	right: -0.4rem;
	min-width: 1.3rem;
	height: 1.3rem;
	padding: 0 0.3rem;
	display: grid;
	place-items: center;
	border-radius: 999px;
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	font-size: 0.68rem;
	font-weight: 700;
	line-height: 1;
	border: 2px solid var(--dt-surface);
	font-variant-numeric: tabular-nums;
	box-shadow: var(--dt-shadow-sm);
}
.tile-badge.is-check {
	background: var(--dt-success-fill);
	color: #fff;
}

/* Pasek postępu celu (np. woda 3/8) */
.tile-progress {
	position: absolute;
	left: 0.45rem;
	right: 0.45rem;
	bottom: 0.3rem;
	height: 4px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--dt-text-3) 18%, transparent);
	overflow: hidden;
}
.tile-progress span {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: var(--dt-success-fill);
	transition: width 0.35s var(--dt-ease);
}

.tile-label {
	font-size: 0.72rem;
	font-weight: 600;
	line-height: 1.2;
	color: var(--dt-text-2);
	text-align: center;
	max-width: 100%;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-word;
}

.is-bouncing .tile-face {
	animation: tile-pop 0.38s var(--dt-spring);
}
@keyframes tile-pop {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(1.18);
	}
	70% {
		transform: scale(0.94);
	}
	100% {
		transform: scale(1);
	}
}

.tile-badge-enter-active {
	transition: transform 0.3s var(--dt-spring), opacity 0.2s ease;
}
.tile-badge-leave-active {
	transition: opacity 0.12s ease;
	position: absolute;
}
.tile-badge-enter-from {
	transform: scale(0.3);
	opacity: 0;
}
.tile-badge-leave-to {
	opacity: 0;
}
</style>
