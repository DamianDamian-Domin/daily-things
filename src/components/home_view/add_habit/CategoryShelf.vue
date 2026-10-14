<template>
	<div
		class="cat-shelf"
		:class="{ 'can-left': railEdges.left, 'can-right': railEdges.right }">
		<button
			type="button"
			class="cat-arrow is-left"
			tabindex="-1"
			aria-hidden="true"
			@click="scrollRail(-1)">
			<i class="pi pi-chevron-left"></i>
		</button>
		<div
			ref="railRef"
			class="cat-rail"
			role="radiogroup"
			aria-label="Category"
			@scroll.passive="updateRailEdges"
			@wheel="onRailWheel"
			@keydown="onRailKeydown">
			<template
				v-for="f in filters"
				:key="f.key">
				<span
					v-if="f.key === firstCatalogKey"
					class="cat-sep"
					aria-hidden="true"></span>
				<button
					type="button"
					role="radio"
					class="cat-tile"
					:class="`is-${f.key}`"
					:aria-checked="category === f.key"
					:tabindex="category === f.key ? 0 : -1"
					:data-key="f.key"
					:style="{ '--tint': PALETTES[f.palette].h, '--tint-strong': PALETTES[f.palette].f }"
					@click="selectCategory(f.key)">
					<span class="cat-face">
						<PixelIcon
							:icon="f.icon"
							:palette="f.palette"
							:size="26" />
					</span>
					<span class="cat-label">{{ f.short }}</span>
				</button>
			</template>
		</div>
		<button
			type="button"
			class="cat-arrow is-right"
			tabindex="-1"
			aria-hidden="true"
			@click="scrollRail(1)">
			<i class="pi pi-chevron-right"></i>
		</button>
	</div>
</template>

<script setup lang="ts">
// Półka kategorii: jeden rząd pikselowych kafelków. Mysz: strzałki
// i kółko, dotyk: przesunięcie palcem, klawiatura: strzałki
// (radiogroup z „wędrującym” tabindexem).
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { usePreferencesStore } from "@/stores/userPreferences";
import { SUPER_CATEGORIES } from "@/utils/habitCatalog";
import { PALETTES } from "@/utils/pixelIcons";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { CategoryFilter, FilterKey } from "./types";

const props = defineProps<{ filters: CategoryFilter[] }>();
const category = defineModel<FilterKey>({ required: true });

const preferences = usePreferencesStore();

// Pionowa kreska oddziela „specjalne” filtry od kategorii katalogu
const CATALOG_KEYS = new Set<FilterKey>(SUPER_CATEGORIES.map((c) => c.key));
const firstCatalogKey = computed(() => props.filters.find((f) => CATALOG_KEYS.has(f.key))?.key);

// ==========================================================================
// Przewijanie myszą, dotykiem i klawiaturą
// ==========================================================================
const railRef = ref<HTMLElement | null>(null);
const railEdges = reactive({ left: false, right: false });

function updateRailEdges() {
	const rail = railRef.value;
	if (!rail) return;
	const max = rail.scrollWidth - rail.clientWidth;
	railEdges.left = rail.scrollLeft > 2;
	railEdges.right = rail.scrollLeft < max - 2;
}

// Zmiana listy filtrów zmienia szerokość półki — przeliczamy krawędzie
watch(
	() => props.filters,
	() => nextTick(updateRailEdges),
);

let railObserver: ResizeObserver | null = null;
watch(railRef, (rail) => {
	railObserver?.disconnect();
	if (!rail || typeof ResizeObserver === "undefined") return;
	railObserver = new ResizeObserver(() => updateRailEdges());
	railObserver.observe(rail);
});
onBeforeUnmount(() => railObserver?.disconnect());

const scrollBehavior = (): ScrollBehavior => (preferences.animationsEnabled ? "smooth" : "auto");

// Strzałki przewijają o „stronę” kafelków
function scrollRail(direction: -1 | 1) {
	const rail = railRef.value;
	if (!rail) return;
	rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.7, 120), behavior: scrollBehavior() });
}

// Kółko myszy (pionowe) przewija półkę w poziomie; na krańcach oddajemy je oknu
function onRailWheel(event: WheelEvent) {
	const rail = railRef.value;
	if (!rail || event.ctrlKey) return;
	if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return; // gładzik w poziomie — natywnie
	const max = rail.scrollWidth - rail.clientWidth;
	if (max <= 0) return;
	if ((event.deltaY < 0 && rail.scrollLeft <= 0) || (event.deltaY > 0 && rail.scrollLeft >= max - 1)) return;
	event.preventDefault();
	const delta = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY; // linie → piksele
	rail.scrollLeft += delta;
}

function tileEl(key: FilterKey) {
	return railRef.value?.querySelector<HTMLElement>(`[data-key="${key}"]`) ?? null;
}

// Wybrany kafelek zawsze w pełni widoczny (z zapasem na wygaszone krawędzie)
function revealTile(key: FilterKey) {
	const rail = railRef.value;
	const tile = tileEl(key);
	if (!rail || !tile) return;
	const margin = 48;
	const left = tile.offsetLeft - rail.scrollLeft;
	const right = left + tile.offsetWidth;
	if (left < margin) rail.scrollBy({ left: left - margin, behavior: scrollBehavior() });
	else if (right > rail.clientWidth - margin)
		rail.scrollBy({ left: right - rail.clientWidth + margin, behavior: scrollBehavior() });
}

function selectCategory(key: FilterKey) {
	category.value = key;
	nextTick(() => revealTile(key));
}

// Radiogroup: strzałki / Home / End przenoszą fokus i od razu wybierają kategorię
function onRailKeydown(event: KeyboardEvent) {
	const keys = props.filters.map((f) => f.key);
	const index = keys.indexOf(category.value);
	let next: number;
	switch (event.key) {
		case "ArrowRight":
		case "ArrowDown":
			next = (index + 1) % keys.length;
			break;
		case "ArrowLeft":
		case "ArrowUp":
			next = (index - 1 + keys.length) % keys.length;
			break;
		case "Home":
			next = 0;
			break;
		case "End":
			next = keys.length - 1;
			break;
		default:
			return;
	}
	event.preventDefault();
	selectCategory(keys[next]);
	nextTick(() => tileEl(keys[next])?.focus({ preventScroll: true }));
}

// Po otwarciu okna półka wraca na początek
function reset() {
	if (railRef.value) railRef.value.scrollLeft = 0;
	updateRailEdges();
}

defineExpose({ select: selectCategory, reset });
</script>

<style scoped>
.cat-shelf {
	position: relative;
	flex-shrink: 0;
	margin-top: 0.45rem;
	--fade: 2.75rem;
}
.cat-rail {
	display: flex;
	align-items: flex-start;
	gap: 0.15rem;
	padding: 0.4rem 1rem 0.35rem;
	overflow-x: auto;
	overflow-y: hidden;
	scrollbar-width: none;
	overscroll-behavior-x: contain;
}
.cat-rail::-webkit-scrollbar {
	display: none;
}
/* Wygaszone krawędzie tylko po tej stronie, gdzie jest coś jeszcze */
.can-left .cat-rail {
	-webkit-mask-image: linear-gradient(to right, transparent, #000 var(--fade));
	mask-image: linear-gradient(to right, transparent, #000 var(--fade));
}
.can-right .cat-rail {
	-webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--fade)), transparent);
	mask-image: linear-gradient(to right, #000 calc(100% - var(--fade)), transparent);
}
.can-left.can-right .cat-rail {
	-webkit-mask-image: linear-gradient(
		to right,
		transparent,
		#000 var(--fade),
		#000 calc(100% - var(--fade)),
		transparent
	);
	mask-image: linear-gradient(to right, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
}
/* Na dotyku kafelki „zaskakują” przy przesuwaniu palcem */
@media (pointer: coarse) {
	.cat-rail {
		scroll-snap-type: x proximity;
		scroll-padding-inline: 1rem;
	}
	.cat-tile {
		scroll-snap-align: start;
	}
}

.cat-sep {
	flex: 0 0 1px;
	align-self: center;
	height: 2.4rem;
	margin: 0 0.3rem 1.1rem;
	background: var(--dt-border-strong);
	border-radius: 1px;
}

.cat-tile {
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	width: 3.9rem;
	padding: 0.15rem 0 0.1rem;
	border: none;
	border-radius: var(--dt-radius);
	background: transparent;
	color: var(--dt-text-2);
	font-family: var(--dt-font);
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
}
.cat-face {
	display: grid;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 0.85rem;
	background: color-mix(in srgb, var(--tint) 32%, var(--dt-surface));
	box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--tint-strong) 22%, transparent);
	transition:
		transform var(--dt-t) var(--dt-spring),
		box-shadow var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease;
}
:where(.my-app-dark) .cat-face {
	background: color-mix(in srgb, var(--tint-strong) 16%, var(--dt-surface));
}
.cat-label {
	max-width: 100%;
	font-size: 0.72rem;
	font-weight: 600;
	line-height: 1.15;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: color var(--dt-t-fast) ease;
}
/* Wybrana kategoria: uniesiona, z akcentowym pierścieniem i pogrubionym podpisem */
.cat-tile[aria-checked="true"] .cat-face {
	transform: translateY(var(--dt-lift));
	background: color-mix(in srgb, var(--tint) 55%, var(--dt-surface));
	box-shadow:
		0 0 0 2px var(--dt-surface),
		0 0 0 4px var(--dt-accent),
		var(--dt-shadow-sm);
}
:where(.my-app-dark) .cat-tile[aria-checked="true"] .cat-face {
	background: color-mix(in srgb, var(--tint-strong) 30%, var(--dt-surface));
}
.cat-tile[aria-checked="true"] .cat-label {
	color: var(--dt-accent-ink);
	font-weight: 700;
}
.cat-tile:active .cat-face {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 1.4));
}
.cat-tile:focus-visible {
	outline: none;
}
.cat-tile:focus-visible .cat-face {
	outline: 2px solid var(--dt-focus);
	outline-offset: 5px;
}
@media (hover: hover) {
	.cat-tile:hover .cat-face {
		transform: translateY(var(--dt-lift));
		box-shadow:
			inset 0 -3px 0 color-mix(in srgb, var(--tint-strong) 30%, transparent),
			var(--dt-shadow-hover);
	}
	.cat-tile[aria-checked="true"]:hover .cat-face {
		box-shadow:
			0 0 0 2px var(--dt-surface),
			0 0 0 4px var(--dt-accent),
			var(--dt-shadow-hover);
	}
	.cat-tile:hover .cat-label {
		color: var(--dt-text);
	}
	.cat-tile[aria-checked="true"]:hover .cat-label {
		color: var(--dt-accent-ink);
	}
}

/* Strzałki — tylko z myszką, pojawiają się po stronie, gdzie jest więcej */
.cat-arrow {
	display: none;
}
@media (hover: hover) and (pointer: fine) {
	.cat-arrow {
		position: absolute;
		top: 0.6rem;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--dt-text-2);
		cursor: pointer;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--dt-t-fast) ease;
	}
	.cat-arrow i {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 50%;
		border: 1px solid var(--dt-border);
		background: var(--dt-surface);
		box-shadow: var(--dt-shadow);
		font-size: 0.7rem;
		transition:
			background-color var(--dt-t-fast) ease,
			color var(--dt-t-fast) ease,
			transform var(--dt-t) var(--dt-ease);
	}
	.cat-arrow.is-left {
		left: 0.15rem;
	}
	.cat-arrow.is-right {
		right: 0.15rem;
	}
	.can-left .cat-arrow.is-left,
	.can-right .cat-arrow.is-right {
		opacity: 1;
		pointer-events: auto;
	}
	.cat-arrow:hover i {
		background: var(--dt-accent-soft);
		color: var(--dt-accent-ink);
		transform: scale(1.08);
	}
	.cat-arrow:active i {
		transform: scale(var(--dt-press));
	}
}
</style>
