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

			<CategoryShelf
				ref="shelfRef"
				v-model="category"
				:filters="filters" />

			<div
				ref="scrollRef"
				class="add-scroll">
				<Transition name="add-fade">
					<CustomHabitForm
						v-if="creating"
						ref="customFormRef"
						v-model:name="customName"
						v-model:icon="customIcon"
						v-model:negative="customNegative"
						:mode="mode"
						@submit="submitCustom"
						@cancel="creating = false" />
				</Transition>

				<p
					v-if="category === 'negative' && !query && !creating"
					class="break-hint">
					Noticing a slip is the first step to changing it. Log it kindly 🌱
				</p>

				<HabitSections
					v-model:managing="managing"
					:mode="mode"
					:sections="sections"
					@tap="onTap"
					@minus="onMinus"
					@delete="deleteCustom" />

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
						@click="shelfRef?.select('all')">
						See {{ matchesElsewhere }} {{ matchesElsewhere === 1 ? "match" : "matches" }} in all categories
					</button>
				</div>

				<CreateHabitCta
					v-if="!creating"
					:query="query"
					:breaking="category === 'negative'"
					@create="startCreating" />
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
import { computed, nextTick, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import type { Habbit } from "@/libs/types";
import { useHabbitsStore } from "@/stores/habbits";
import { useSound } from "@/utils/useSound";
import {
	CUSTOM_CATEGORY,
	STARTER_HABBITS,
	SUPER_CATEGORIES,
	findCatalogHabbit,
	isNegative,
	matchesQuery,
	normalizeText,
	superCategoryOf,
} from "@/utils/habitCatalog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import CategoryShelf from "@/components/home_view/add_habit/CategoryShelf.vue";
import CreateHabitCta from "@/components/home_view/add_habit/CreateHabitCta.vue";
import CustomHabitForm from "@/components/home_view/add_habit/CustomHabitForm.vue";
import HabitSections from "@/components/home_view/add_habit/HabitSections.vue";
import type { CategoryFilter, FilterKey, HabitSection } from "@/components/home_view/add_habit/types";

const props = defineProps<{ mode: "log" | "goal" }>();
const emit = defineEmits<{ (e: "logged"): void }>();
const visible = defineModel<boolean>({ default: false });

const habbitsStore = useHabbitsStore();
const { playHabitCheck, playUncheck } = useSound();

// Filtry „specjalne” (poza kategoriami katalogu)
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
const shelfRef = ref<InstanceType<typeof CategoryShelf> | null>(null);
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
	nextTick(() => shelfRef.value?.reset());
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

// Kafelki filtrów — tylko te, w których coś jest (w trybie celów nie ma złych nawyków)
const filters = computed<CategoryFilter[]>(() => {
	const has = (test: (h: Habbit) => boolean) => pool.value.some(test);
	const list: CategoryFilter[] = [ALL_FILTER];
	if (has((h) => h.origin === "user")) list.push(CUSTOM_CATEGORY);
	if (has(isNegative)) list.push(NEGATIVE_FILTER);
	for (const cat of SUPER_CATEGORIES) if (has((h) => superCategoryOf(h)?.key === cat.key)) list.push(cat);
	return list;
});
const activeFilter = computed(() => filters.value.find((f) => f.key === category.value) ?? ALL_FILTER);

// Np. po usunięciu ostatniego własnego habitu filtr „Yours” znika — wracamy do „All”
watch(filters, (list) => {
	if (!list.some((f) => f.key === category.value)) category.value = "all";
});

function inFilter(h: Habbit, key: FilterKey = category.value) {
	if (key === "all") return true;
	if (key === "negative") return isNegative(h);
	return superCategoryOf(h)?.key === key;
}

const normalizedQuery = computed(() => normalizeText(query.value.trim()));

const sections = computed<HabitSection[]>(() => {
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
		const result: HabitSection[] = [];
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

	const result: HabitSection[] = [];
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
const customFormRef = ref<InstanceType<typeof CustomHabitForm> | null>(null);

function startCreating() {
	customName.value = query.value.trim();
	customIcon.value = "star";
	// Tworzenie z widoku „Break” od razu oznacza habit jako zły nawyk
	customNegative.value = props.mode === "log" && category.value === "negative";
	creating.value = true;
	if (scrollRef.value) scrollRef.value.scrollTop = 0;
	nextTick(() => customFormRef.value?.focus());
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

/* Działa też na formularzu-dziecku: korzeń komponentu dziedziczy scope rodzica */
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
