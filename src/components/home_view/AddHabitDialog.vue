<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'add-habit-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog add-dialog"
		@show="onShow">
		<div class="add-shell">
			<div class="add-head">
				<span
					class="add-emoji"
					:class="`mode-${mode}`"
					aria-hidden="true"
					>{{ mode === "log" ? "🌱" : "🎯" }}</span
				>
				<div class="add-head-text">
					<h2
						id="add-habit-title"
						class="dt-title">
						{{ mode === "log" ? logTitle : "Your daily goals" }}
					</h2>
					<p class="dt-subtitle">
						{{
							mode === "log"
								? "Tap to log. Tap again if you did it more than once."
								: "Tap to add a goal. Tap again to aim for it several times a day."
						}}
					</p>
				</div>
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Close"
					@click="visible = false">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>

			<div class="add-search">
				<i
					class="pi pi-search"
					aria-hidden="true"></i>
				<input
					ref="searchRef"
					v-model="query"
					type="search"
					class="dt-input"
					:placeholder="`Search ${pool.length} habits…`"
					aria-label="Search habits"
					autocomplete="off"
					spellcheck="false"
					@keydown.enter.prevent="onSearchEnter" />
			</div>

			<!-- Półka kategorii: jeden rząd pikselowych kafelków. Mysz: strzałki
			     i kółko, dotyk: przesunięcie palcem, klawiatura: strzałki
			     (radiogroup z „wędrującym” tabindexem). -->
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

			<div
				ref="scrollRef"
				class="add-scroll">
				<!-- Tworzenie własnego habitu -->
				<Transition name="add-fade">
					<form
						v-if="creating"
						class="dt-panel create-form"
						@submit.prevent="submitCustom">
						<div class="dt-field">
							<label
								for="custom-name"
								class="dt-label"
								>Name your habit</label
							>
							<input
								id="custom-name"
								ref="customNameRef"
								v-model="customName"
								class="dt-input"
								maxlength="40"
								placeholder="e.g. Practice guitar" />
						</div>
						<fieldset class="icon-picker">
							<legend class="dt-label">Pick an icon</legend>
							<div class="icon-grid">
								<button
									v-for="icon in CUSTOM_ICONS"
									:key="icon"
									type="button"
									class="icon-choice"
									:aria-pressed="customIcon === icon"
									:aria-label="icon.replace(/_/g, ' ')"
									@click="customIcon = icon">
									<PixelIcon
										:icon="icon"
										:palette="customNegative ? 'plum' : 'orange'"
										:size="26" />
								</button>
							</div>
						</fieldset>
						<label
							v-if="mode === 'log'"
							class="negative-toggle dt-check-label">
							<input
								v-model="customNegative"
								type="checkbox"
								class="dt-check" />
							It's a habit I want to break
						</label>
						<div class="create-actions">
							<button
								type="button"
								class="dt-btn dt-btn-ghost dt-btn-sm"
								@click="creating = false">
								Cancel
							</button>
							<button
								type="submit"
								class="dt-btn dt-btn-primary dt-btn-sm"
								:disabled="!customName.trim()">
								{{ mode === "log" ? "Create & log" : "Create & add goal" }}
							</button>
						</div>
					</form>
				</Transition>

				<p
					v-if="category === 'negative' && !query && !creating"
					class="break-hint">
					Noticing a slip is the first step to changing it. Log it kindly 🌱
				</p>

				<section
					v-for="section in sections"
					:key="section.key"
					class="add-section"
					:aria-label="section.title">
					<div class="add-section-head">
						<PixelIcon
							:icon="section.icon"
							:palette="section.palette"
							:size="26" />
						<h3 class="dt-section-title">{{ section.title }}</h3>
						<button
							v-if="section.key === 'yours'"
							type="button"
							class="dt-link manage-link"
							@click="managing = !managing">
							{{ managing ? "Done" : "Manage" }}
						</button>
					</div>
					<div class="add-grid">
						<div
							v-for="h in section.items"
							:key="section.key + h.name"
							class="add-cell">
							<HabitTile
								:habbit="h"
								show-label
								:tooltip="false"
								:badge="badgeFor(h)"
								:selected="countFor(h) > 0"
								:aria-label="tileLabel(h)"
								@click="onTap(h)" />
							<button
								v-if="managing && section.key === 'yours'"
								type="button"
								class="cell-mini is-delete"
								:aria-label="`Delete ${h.display_name}`"
								@click="deleteCustom(h)">
								<i
									class="pi pi-trash"
									aria-hidden="true"></i>
							</button>
							<button
								v-else-if="countFor(h) > 0"
								type="button"
								class="cell-mini"
								:aria-label="`Remove one ${h.display_name}`"
								@click="onMinus(h)">
								<i
									class="pi pi-minus"
									aria-hidden="true"></i>
							</button>
						</div>
					</div>
				</section>

				<!-- Pusto: w wybranej kategorii nic nie pasuje — proponujemy szukanie wszędzie -->
				<div
					v-if="sections.length === 0 && !creating"
					class="dt-empty add-empty">
					<PixelIcon
						:icon="query ? 'search' : 'potted_plant'"
						:palette="query ? 'orange' : 'green'"
						:size="52" />
					<p>{{ emptyText }}</p>
					<button
						v-if="query && category !== 'all' && matchesElsewhere > 0"
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						@click="selectCategory('all')">
						See {{ matchesElsewhere }} {{ matchesElsewhere === 1 ? "match" : "matches" }} in all categories
					</button>
				</div>

				<button
					v-if="!creating"
					type="button"
					class="create-cta"
					@click="startCreating">
					<span
						class="create-plus"
						aria-hidden="true"
						>+</span
					>
					<span>
						<strong>{{ query ? `Create “${query.trim()}”` : "Create your own habit" }}</strong>
						<small>{{
							category === "negative"
								? "Something else you'd like to cut back on?"
								: "Can't find it? Make it yours."
						}}</small>
					</span>
				</button>
			</div>

			<div class="add-foot">
				<p
					class="add-summary"
					aria-live="polite">
					{{ summary }}
				</p>
				<button
					type="button"
					class="dt-btn dt-btn-primary"
					@click="visible = false">
					Done
				</button>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import type { Habbit } from "@/libs/types";
import { useHabbitsStore } from "@/stores/habbits";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useSound } from "@/utils/useSound";
import {
	CUSTOM_CATEGORY,
	STARTER_HABBITS,
	SUPER_CATEGORIES,
	displayName,
	findCatalogHabbit,
	isNegative,
	matchesQuery,
	normalizeText,
	superCategoryOf,
	type SuperCategoryKey,
} from "@/utils/habitCatalog";
import { PALETTES, type PaletteKey } from "@/utils/pixelIcons";
import HabitTile from "@/components/home_view/HabitTile.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const props = defineProps<{ mode: "log" | "goal" }>();
const emit = defineEmits<{ (e: "logged"): void }>();
const visible = defineModel<boolean>({ default: false });

const habbitsStore = useHabbitsStore();
const preferences = usePreferencesStore();
const { playHabitCheck, playUncheck } = useSound();

const CUSTOM_ICONS = [
	"star",
	"favorite",
	"bolt",
	"local_florist",
	"water_drop",
	"self_improvement",
	"fitness_center",
	"directions_run",
	"menu_book",
	"music_note",
	"brush",
	"code",
	"restaurant",
	"coffee",
	"bedtime",
	"sunny",
	"pets",
	"home",
	"school",
	"work",
	"savings",
	"spa",
	"psychology",
	"celebration",
	"rocket_launch",
	"flag",
	"trophy",
	"potted_plant",
];

// Filtr: wszystko, złe nawyki („do rzucenia”) albo jedna z kategorii katalogu
type FilterKey = "all" | "negative" | SuperCategoryKey;
interface CategoryFilter {
	key: FilterKey;
	label: string;
	short: string;
	icon: string;
	palette: PaletteKey;
}
const ALL_FILTER: CategoryFilter = {
	key: "all",
	label: "All habits",
	short: "All",
	icon: "category",
	palette: "orange",
};
const NEGATIVE_FILTER: CategoryFilter = {
	key: "negative",
	label: "Habits to break",
	short: "Break",
	icon: "do_not_disturb_on",
	palette: "plum",
};

const query = ref("");
const category = ref<FilterKey>("all");
const searchRef = ref<HTMLInputElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const sessionAdds = ref(0);
const managing = ref(false);
// Kolejność „ostatnio używanych” zamrażamy na czas otwarcia okna —
// inaczej kafelki przeskakiwałyby pod palcem po każdym stuknięciu
const recentSnapshot = ref<string[]>([]);

const logTitle = computed(() =>
	habbitsStore.isSelectedToday ? "What did you do today?" : "What did you do that day?",
);

function onShow() {
	query.value = "";
	category.value = "all";
	sessionAdds.value = 0;
	creating.value = false;
	managing.value = false;
	recentSnapshot.value = [...habbitsStore.recentHabbits];
	nextTick(() => {
		if (railRef.value) railRef.value.scrollLeft = 0;
		updateRailEdges();
	});
	// Na telefonie nie otwieramy od razu klawiatury — zasłoniłaby listę
	if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
		nextTick(() => searchRef.value?.focus());
	}
}

watch([query, category], () => {
	if (scrollRef.value) scrollRef.value.scrollTop = 0;
});

// ==========================================================================
// Dane
// ==========================================================================
// Celem może być tylko coś, czego chcemy robić więcej — bez złych nawyków
const pool = computed(() =>
	habbitsStore.allHabbitsList.filter((h) => props.mode === "log" || !isNegative(h)),
);

const goalCounts = computed(() => {
	const counts: Record<string, number> = {};
	for (const g of habbitsStore.dailyGoalsList) counts[g.name] = (counts[g.name] ?? 0) + 1;
	return counts;
});

function countFor(h: Habbit) {
	return props.mode === "log"
		? (habbitsStore.selectedCounts[h.name] ?? 0)
		: (goalCounts.value[h.name] ?? 0);
}

function badgeFor(h: Habbit) {
	const n = countFor(h);
	if (n === 0) return null;
	return props.mode === "goal" || n > 1 ? `×${n}` : "✓";
}

function tileLabel(h: Habbit) {
	const n = countFor(h);
	const name = displayName(h);
	if (n === 0) return props.mode === "log" ? `Log ${name}` : `Add goal: ${name}`;
	return props.mode === "log"
		? `${name}, logged ${n} ${n === 1 ? "time" : "times"}. Log again`
		: `${name}, goal ${n} ${n === 1 ? "time" : "times"} a day. Add one more`;
}

// Kafelki filtrów — tylko te, w których coś jest (w trybie celów nie ma złych nawyków)
const filters = computed<CategoryFilter[]>(() => {
	const has = (test: (h: Habbit) => boolean) => pool.value.some(test);
	const list: CategoryFilter[] = [ALL_FILTER];
	if (has((h) => h.origin === "user")) list.push(CUSTOM_CATEGORY);
	if (has(isNegative)) list.push(NEGATIVE_FILTER);
	for (const cat of SUPER_CATEGORIES) if (has((h) => superCategoryOf(h)?.key === cat.key)) list.push(cat);
	return list;
});
// Pionowa kreska oddziela „specjalne” filtry od kategorii katalogu
const CATALOG_KEYS = new Set<FilterKey>(SUPER_CATEGORIES.map((c) => c.key));
const firstCatalogKey = computed(() => filters.value.find((f) => CATALOG_KEYS.has(f.key))?.key);
const activeFilter = computed(() => filters.value.find((f) => f.key === category.value) ?? ALL_FILTER);

// Np. po usunięciu ostatniego własnego habitu filtr „Yours” znika — wracamy do „All”
watch(filters, (list) => {
	if (!list.some((f) => f.key === category.value)) category.value = "all";
	nextTick(updateRailEdges);
});

// ==========================================================================
// Półka kategorii (przewijanie myszą, dotykiem i klawiaturą)
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
	const keys = filters.value.map((f) => f.key);
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

function inFilter(h: Habbit, key: FilterKey = category.value) {
	if (key === "all") return true;
	if (key === "negative") return isNegative(h);
	return superCategoryOf(h)?.key === key;
}

interface Section {
	key: string;
	title: string;
	icon: string;
	palette: PaletteKey;
	items: Habbit[];
}

const normalizedQuery = computed(() => normalizeText(query.value.trim()));

const sections = computed<Section[]>(() => {
	const q = normalizedQuery.value;

	if (q) {
		const items = pool.value.filter((h) => inFilter(h) && matchesQuery(h, q));
		const where = category.value === "all" ? "" : ` in ${activeFilter.value.label}`;
		return items.length
			? [{ key: "results", title: `${items.length} found${where}`, icon: "search", palette: "orange", items }]
			: [];
	}

	// Złe nawyki: najpierw własne, potem z katalogu pogrupowane po kategoriach
	if (category.value === "negative") {
		const result: Section[] = [];
		const custom = pool.value.filter((h) => h.origin === "user" && isNegative(h));
		if (custom.length)
			result.push({ key: "yours", title: CUSTOM_CATEGORY.label, icon: "star", palette: "orange", items: custom });
		for (const cat of SUPER_CATEGORIES) {
			const items = pool.value.filter(
				(h) => h.origin !== "user" && isNegative(h) && superCategoryOf(h)?.key === cat.key,
			);
			if (items.length)
				result.push({ key: `negative-${cat.key}`, title: cat.label, icon: cat.icon, palette: cat.palette, items });
		}
		return result;
	}

	if (category.value !== "all") {
		const f = activeFilter.value;
		const items = pool.value.filter((h) => inFilter(h));
		return items.length ? [{ key: f.key, title: f.label, icon: f.icon, palette: f.palette, items }] : [];
	}

	const result: Section[] = [];
	const shown = new Set<string>();
	const take = (items: Habbit[]) => items.filter((h) => !shown.has(h.name) && shown.add(h.name));

	if (props.mode === "goal") {
		const current = [...new Set(habbitsStore.dailyGoalsList.map((g) => g.name))].map((name) =>
			habbitsStore.resolve({ name }),
		);
		if (current.length)
			result.push({ key: "current", title: "Your goals", icon: "flag", palette: "yellow", items: take(current) });
	}

	const custom = pool.value.filter((h) => h.origin === "user");
	if (custom.length)
		result.push({ key: "yours", title: CUSTOM_CATEGORY.label, icon: "star", palette: "orange", items: custom });
	custom.forEach((h) => shown.add(h.name));

	const recent = recentSnapshot.value
		.map((name) => pool.value.find((h) => h.name === name))
		.filter((h): h is Habbit => Boolean(h));
	const suggested = recent.length
		? recent
		: STARTER_HABBITS.map((n) => findCatalogHabbit(n)).filter((h): h is Habbit => Boolean(h));
	const suggestedItems = take(suggested.slice(0, 12));
	if (suggestedItems.length)
		result.push({
			key: "suggested",
			title: recent.length ? "Recently used" : "Great to start with",
			icon: "star_shine",
			palette: "yellow",
			items: suggestedItems,
		});

	for (const cat of SUPER_CATEGORIES) {
		const items = pool.value.filter((h) => h.origin !== "user" && superCategoryOf(h)?.key === cat.key);
		if (items.length) result.push({ key: cat.key, title: cat.label, icon: cat.icon, palette: cat.palette, items });
	}
	return result;
});

// Ile wyników dałoby to samo wyszukiwanie we wszystkich kategoriach
const matchesElsewhere = computed(() => {
	const q = normalizedQuery.value;
	return q ? pool.value.filter((h) => matchesQuery(h, q)).length : 0;
});

const emptyText = computed(() => {
	const q = query.value.trim();
	if (category.value === "negative")
		return q ? `No habits to break match “${q}”.` : "No habits to break here — lovely! 🌿";
	if (q && category.value !== "all") return `No “${q}” in ${activeFilter.value.label}.`;
	return q ? `Nothing called “${q}” yet.` : "Nothing here yet.";
});

const summary = computed(() => {
	if (props.mode === "goal") {
		const total = habbitsStore.dailyGoalsList.length;
		return total ? `${total} ${total === 1 ? "goal" : "goals"} a day` : "No goals yet";
	}
	if (sessionAdds.value === 0) return "Nothing added yet";
	return `${sessionAdds.value} added — nice! ✨`;
});

// ==========================================================================
// Akcje
// ==========================================================================
async function onTap(h: Habbit) {
	if (managing.value) return;
	if (props.mode === "log") {
		playHabitCheck();
		if (habbitsStore.logHabbit(h)) {
			sessionAdds.value++;
			emit("logged");
		}
	} else {
		playHabitCheck();
		await habbitsStore.addDailyGoal(h);
	}
}

async function onMinus(h: Habbit) {
	playUncheck();
	if (props.mode === "log") {
		const removed = habbitsStore.unlogHabbit(h.name);
		if (removed && sessionAdds.value > 0) sessionAdds.value--;
	} else {
		await habbitsStore.removeGoalInstance(h.name);
	}
}

function onSearchEnter() {
	const first = sections.value[0]?.items[0];
	if (first) onTap(first);
	else if (query.value.trim()) startCreating();
}

// ---- Własne habity
const creating = ref(false);
const customName = ref("");
const customIcon = ref("star");
const customNegative = ref(false);
const customNameRef = ref<HTMLInputElement | null>(null);

function startCreating() {
	customName.value = query.value.trim();
	customIcon.value = "star";
	// Tworzenie z widoku „Break” od razu oznacza habit jako zły nawyk
	customNegative.value = props.mode === "log" && category.value === "negative";
	creating.value = true;
	if (scrollRef.value) scrollRef.value.scrollTop = 0;
	nextTick(() => customNameRef.value?.focus());
}

async function submitCustom() {
	if (!customName.value.trim()) return;
	const habbit = await habbitsStore.createCustomHabbit(
		customName.value,
		customIcon.value,
		customNegative.value,
	);
	creating.value = false;
	query.value = "";
	await onTap(habbit);
}

async function deleteCustom(h: Habbit) {
	await habbitsStore.deleteCustomHabbit(h.name);
	if (!habbitsStore.customHabbits.length) managing.value = false;
}
</script>

<style scoped>
.add-shell {
	display: flex;
	flex-direction: column;
	height: min(86dvh, 46rem);
	background: var(--dt-surface);
}
.add-head {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 1.1rem 1rem 0.6rem 1.25rem;
}
.add-head-text {
	flex: 1;
	min-width: 0;
}
.add-emoji {
	display: grid;
	place-items: center;
	width: 2.7rem;
	height: 2.7rem;
	border-radius: 0.9rem;
	font-size: 1.35rem;
	background: var(--dt-success-soft);
	flex-shrink: 0;
}
.add-emoji.mode-goal {
	background: color-mix(in srgb, var(--dt-gold) 22%, var(--dt-surface));
}

.add-search {
	position: relative;
	padding: 0 1.25rem;
}
.add-search i {
	position: absolute;
	left: 2.1rem;
	top: 50%;
	transform: translateY(-50%);
	color: var(--dt-accent);
	pointer-events: none;
}
.add-search .dt-input {
	padding-left: 2.6rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-soft);
}

/* ===== Półka kategorii ===== */
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

.break-hint {
	margin: 0.25rem 0 0.9rem;
	padding: 0.55rem 0.8rem;
	border-radius: var(--dt-radius);
	background: color-mix(in srgb, var(--dt-surface-sunken) 70%, var(--dt-surface));
	font-size: var(--dt-text-sm);
	font-style: italic;
	color: var(--dt-text-2);
	line-height: 1.45;
}
.add-empty p {
	margin: 0.15rem 0 0.35rem;
	max-width: 20rem;
	line-height: 1.45;
	color: var(--dt-text-2);
}

.add-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 0.5rem 1.25rem 1rem;
	overscroll-behavior: contain;
}

.add-section {
	margin-bottom: 1.1rem;
}
.add-section-head {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	margin-bottom: 0.5rem;
	position: sticky;
	top: -0.5rem;
	z-index: 2;
	padding: 0.25rem 0;
	background: var(--dt-surface);
}
.manage-link {
	margin-left: auto;
	font-size: var(--dt-text-sm);
}
.add-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(4.6rem, 1fr));
	gap: 0.9rem 0.4rem;
	justify-items: center;
}
.add-cell {
	position: relative;
}
.cell-mini {
	position: absolute;
	top: -0.35rem;
	left: 0.2rem;
	display: grid;
	place-items: center;
	width: 1.6rem;
	height: 1.6rem;
	border-radius: 50%;
	border: 2px solid var(--dt-surface);
	background: var(--dt-surface-sunken);
	color: var(--dt-text-2);
	cursor: pointer;
	box-shadow: var(--dt-shadow-sm);
	z-index: 1;
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.cell-mini i {
	font-size: 0.6rem;
}
.cell-mini.is-delete {
	background: var(--dt-danger-soft);
	color: var(--dt-danger);
}
.cell-mini:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 2));
}
@media (hover: hover) {
	.cell-mini:hover {
		background: var(--dt-accent-soft);
		color: var(--dt-accent-ink);
		transform: scale(calc(1 + (1 - var(--dt-press)) * 2));
	}
	.cell-mini.is-delete:hover {
		background: color-mix(in srgb, var(--dt-danger) 22%, var(--dt-surface));
		color: var(--dt-danger);
	}
}

.create-cta {
	display: flex;
	align-items: center;
	gap: 0.8rem;
	width: 100%;
	margin-top: 0.25rem;
	padding: 0.75rem 0.9rem;
	border-radius: var(--dt-radius-lg);
	border: 2px dashed var(--dt-border-strong);
	background: transparent;
	color: var(--dt-text);
	cursor: pointer;
	text-align: left;
	font-family: var(--dt-font);
	transition:
		border-color var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-ease);
}
.create-cta:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 0.4));
}
@media (hover: hover) {
	.create-cta:hover {
		border-color: var(--dt-accent);
		background: var(--dt-hover-bg);
	}
	.create-cta:hover .create-plus {
		background: var(--dt-accent-strong);
		color: var(--dt-on-accent);
		transform: rotate(90deg);
	}
}
.create-cta span:last-child {
	display: flex;
	flex-direction: column;
}
.create-cta small {
	color: var(--dt-text-3);
	font-size: var(--dt-text-xs);
}
.create-plus {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 0.8rem;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-size: 1.4rem;
	font-weight: 700;
	flex-shrink: 0;
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}

.create-form {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	margin-bottom: 1rem;
}
.icon-picker {
	border: none;
	margin: 0;
	padding: 0;
}
.icon-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(2.6rem, 1fr));
	gap: 0.35rem;
	margin-top: 0.4rem;
}
.icon-choice {
	display: grid;
	place-items: center;
	height: 2.6rem;
	border-radius: 0.75rem;
	border: 2px solid transparent;
	background: var(--dt-surface);
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.icon-choice[aria-pressed="true"] {
	border-color: var(--dt-accent);
	background: var(--dt-accent-soft);
}
.icon-choice:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 1.4));
}
@media (hover: hover) {
	.icon-choice:hover {
		background: var(--dt-hover-bg);
		border-color: var(--dt-hover-border);
		transform: translateY(var(--dt-lift));
	}
	.icon-choice[aria-pressed="true"]:hover {
		border-color: var(--dt-accent);
		background: var(--dt-accent-soft);
	}
}
.negative-toggle {
	align-self: flex-start;
	padding-right: 0.5rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.create-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}

.add-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.75rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
	border-top: 1px solid var(--dt-border);
	background: var(--dt-surface-soft);
}
.add-summary {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	font-weight: 600;
}

.add-fade-enter-active,
.add-fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.add-fade-enter-from,
.add-fade-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>

<style>
.add-dialog.p-dialog {
	width: min(96vw, 42rem);
}
@media (max-width: 640px) {
	.add-dialog.p-dialog {
		width: 100vw;
		max-height: 100dvh;
		margin: 0;
		align-self: flex-end;
		border-radius: var(--dt-radius-xl) var(--dt-radius-xl) 0 0 !important;
	}
	.add-dialog .add-shell {
		height: 88dvh;
	}
}
</style>
