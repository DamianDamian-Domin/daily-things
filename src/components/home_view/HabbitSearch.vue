<template>
	<div class="hs-root">
		<!-- View toggle — Recently / All -->
		<div class="hs-filter-tabs">
			<button
				class="hs-tab"
				:class="{ active: currentView === 'recently' }"
				@click="switchView('recently')">
				<i class="pi pi-clock hs-tab-icon"></i>
				<span>Recently</span>
			</button>
			<button
				class="hs-tab"
				:class="{ active: currentView === 'all' }"
				@click="switchView('all')">
				<i class="pi pi-th-large hs-tab-icon"></i>
				<span>All</span>
			</button>
		</div>

		<!-- Search bar -->
		<div class="hs-search-wrap">
			<i class="pi pi-search hs-search-icon"></i>
			<InputText
				v-model="searchQuery"
				placeholder="Search habits..."
				class="hs-search-input w-full" />
			<button
				v-if="searchQuery"
				class="hs-search-clear"
				@click="searchQuery = ''">
				<i class="pi pi-times"></i>
			</button>
		</div>

		<!-- Category pills — only visible in "all" view -->
		<Transition name="hs-slide">
			<div v-if="currentView === 'all'" class="hs-categories">
				<button
					class="hs-cat-pill"
					:class="{ active: activeCategories.length === allCategoryKeys.length }"
					@click="toggleAllCategories">
					<i class="pi pi-list" style="font-size: 0.6rem"></i>
					All
				</button>
				<button
					v-for="category in allCategoryKeys"
					:key="category"
					class="hs-cat-pill"
					:class="{
						active: activeCategories.includes(category),
						negative: category === 'negative' && activeCategories.includes(category),
					}"
					@click="toggleCategory(category)">
					<span class="hs-cat-dot" :class="'cat-' + category"></span>
					{{ category }}
				</button>
			</div>
		</Transition>

		<!-- Results — Recently view -->
		<div v-if="currentView === 'recently'" class="hs-results">
			<div v-if="recentlyFiltered.length > 0" class="hs-grid">
				<div
					v-for="habit in recentlyFiltered"
					:key="habit.name"
					class="hs-item-wrap"
					:class="{ added: isAdded(habit.name) }"
					@click="onHabitClick(habit)">
					<HabbitItem
						:data="habit"
						:showLabel="true" />
					<!-- Check overlay for added items -->
					<Transition name="hs-check">
						<div v-if="isAdded(habit.name)" class="hs-check-overlay">
							<i class="pi pi-check"></i>
						</div>
					</Transition>
				</div>
			</div>
			<!-- Empty state: recently -->
			<div v-else class="hs-empty">
				<span class="hs-empty-icon">✨</span>
				<p class="hs-empty-title">No recent habits yet</p>
				<p class="hs-empty-text">
					Switch to <button class="hs-empty-link" @click="switchView('all')">All</button>
					to browse the full catalog
				</p>
			</div>
		</div>

		<!-- Results — All view (grouped by category) -->
		<div v-else-if="currentView === 'all'" class="hs-grouped">
			<template v-if="hasVisibleGroups">
				<div
					v-for="(habits, category) in groupedFiltered"
					:key="category"
					class="hs-group">
					<div class="hs-group-head">
						<span class="hs-group-dot" :class="'cat-' + category"></span>
						<h4 class="hs-group-title">{{ category }}</h4>
						<span class="hs-group-count">{{ habits.length }}</span>
					</div>
					<div class="hs-grid">
						<div
							v-for="habit in habits"
							:key="habit.name"
							class="hs-item-wrap"
							:class="{ added: isAdded(habit.name) }"
							@click="onHabitClick(habit)">
							<HabbitItem
								:data="habit"
								:showLabel="true" />
							<Transition name="hs-check">
								<div v-if="isAdded(habit.name)" class="hs-check-overlay">
									<i class="pi pi-check"></i>
								</div>
							</Transition>
						</div>
					</div>
				</div>
			</template>
			<!-- Empty state: search with no results -->
			<div v-else class="hs-empty">
				<span class="hs-empty-icon">🔍</span>
				<p class="hs-empty-title">No habits found</p>
				<p class="hs-empty-text">Try a different search term or category</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";
import InputText from "primevue/inputtext";
import { Habbit } from "@/libs/types";

const habbitsStore = useHabbitsStore();
const tag_categories = habbitsStore.tag_categories;

const props = defineProps<{
	// Names of habits already added in this session (for checkmark overlay)
	addedNames?: string[];
}>();

const emit = defineEmits(["select"]);

// === View state ===
const searchQuery = ref("");

// Two views: "recently" or "all". No deselect — always one active.
const currentView = ref<"recently" | "all">(
	habbitsStore.recentHabbits?.length > 0 ? "recently" : "all"
);

// Active categories for "all" view filtering
const allCategoryKeys = computed(() => Object.keys(tag_categories));
const activeCategories = ref<string[]>([...Object.keys(tag_categories)]);

function switchView(view: "recently" | "all") {
	currentView.value = view;
	searchQuery.value = "";
}

// Toggle a single category on/off
function toggleCategory(category: string) {
	const idx = activeCategories.value.indexOf(category);
	if (idx > -1) {
		// Don't allow deselecting all — keep at least one
		if (activeCategories.value.length > 1) {
			activeCategories.value.splice(idx, 1);
		}
	} else {
		activeCategories.value.push(category);
	}
}

// Toggle all categories on/off
function toggleAllCategories() {
	if (activeCategories.value.length === allCategoryKeys.value.length) {
		// All selected -> select only first
		activeCategories.value = [allCategoryKeys.value[0]];
	} else {
		activeCategories.value = [...allCategoryKeys.value];
	}
}

// === Check if habit was already added ===
function isAdded(name: string): boolean {
	return props.addedNames?.includes(name) ?? false;
}

// Click handler — emit select if not already added
function onHabitClick(habit: Habbit) {
	if (!isAdded(habit.name)) {
		emit("select", habit);
	}
}

// === Filtering ===

// Text search filter
function matchesSearch(habit: Habbit): boolean {
	if (!searchQuery.value.trim()) return true;
	const q = searchQuery.value.toLowerCase();
	return (
		habit.name.toLowerCase().includes(q) ||
		(habit.display_name?.toLowerCase().includes(q) ?? false)
	);
}

// Recently used — filtered by search
const recentlyFiltered = computed(() => {
	return habbitsStore.allHabbitsList
		.filter((h) => habbitsStore.recentHabbits.includes(h.name))
		.filter(matchesSearch);
});

// Determine habit category based on its tags
function getCategoryForHabit(habit: Habbit): string {
	for (const [category, tags] of Object.entries(tag_categories)) {
		if (habit.tags?.some((tag) => tags.includes(tag))) {
			return category;
		}
	}
	return "other";
}

// Grouped by category — filtered by search + active categories
const groupedFiltered = computed(() => {
	const grouped: Record<string, Habbit[]> = {};

	habbitsStore.allHabbitsList
		.filter(matchesSearch)
		.forEach((habit) => {
			const cat = getCategoryForHabit(habit);
			if (activeCategories.value.includes(cat)) {
				if (!grouped[cat]) grouped[cat] = [];
				grouped[cat].push(habit);
			}
		});

	return grouped;
});

const hasVisibleGroups = computed(() => {
	return Object.keys(groupedFiltered.value).length > 0;
});
</script>

<style scoped>
/* =====================================================
   ROOT
   ===================================================== */
.hs-root {
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
}

/* =====================================================
   FILTER TABS — segmented control
   ===================================================== */
.hs-filter-tabs {
	display: flex;
	gap: 0.35rem;
	padding: 0.25rem;
	border-radius: 0.75rem;
	background: var(--p-orange-50);
}
:where(.my-app-dark, .my-app-dark *) .hs-filter-tabs {
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
}

.hs-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	padding: 0.5rem 0.65rem;
	border-radius: 0.55rem;
	border: none;
	cursor: pointer;
	font-family: 'Lora', serif;
	font-size: 0.78rem;
	font-weight: 500;
	color: var(--p-gray-500);
	background: transparent;
	transition: all 0.25s ease;
	user-select: none;
}
.hs-tab:hover {
	color: var(--p-gray-700);
	background: color-mix(in srgb, var(--p-orange-100) 55%, transparent);
}
.hs-tab.active {
	background: white;
	color: var(--p-orange-600);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
	font-weight: 600;
}
:where(.my-app-dark, .my-app-dark *) .hs-tab {
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-tab:hover {
	color: var(--p-gray-200);
	background: color-mix(in srgb, var(--p-gray-600) 40%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-tab.active {
	background: var(--p-gray-700);
	color: var(--p-orange-400);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.hs-tab-icon {
	font-size: 0.78rem;
	opacity: 0.7;
}
.hs-tab.active .hs-tab-icon {
	opacity: 1;
}

/* =====================================================
   SEARCH BAR — with inline icon + clear button
   ===================================================== */
.hs-search-wrap {
	position: relative;
	display: flex;
	align-items: center;
}
.hs-search-icon {
	position: absolute;
	left: 0.75rem;
	font-size: 0.85rem;
	color: var(--p-gray-400);
	z-index: 1;
	pointer-events: none;
}
:where(.my-app-dark, .my-app-dark *) .hs-search-icon {
	color: var(--p-gray-500);
}
.hs-search-input {
	padding-left: 2.25rem !important;
	padding-right: 2.25rem !important;
}
.hs-search-clear {
	position: absolute;
	right: 0.6rem;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	border: none;
	background: var(--p-gray-100);
	color: var(--p-gray-500);
	font-size: 0.6rem;
	cursor: pointer;
	transition: all 0.2s ease;
}
.hs-search-clear:hover {
	background: var(--p-gray-200);
	color: var(--p-gray-700);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-clear {
	background: var(--p-gray-600);
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-clear:hover {
	background: var(--p-gray-500);
	color: var(--p-gray-200);
}

/* =====================================================
   CATEGORY PILLS
   ===================================================== */
.hs-categories {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
}

.hs-cat-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.3rem 0.7rem;
	border-radius: 9999px;
	border: 1px solid var(--p-orange-100);
	background: white;
	color: var(--p-gray-500);
	font-size: 0.72rem;
	font-weight: 500;
	cursor: pointer;
	text-transform: capitalize;
	transition: all 0.2s ease;
	user-select: none;
	white-space: nowrap;
}
.hs-cat-pill:hover {
	border-color: var(--p-orange-300);
	color: var(--p-gray-700);
	background: var(--p-orange-50);
}
.hs-cat-pill.active {
	background: var(--p-orange-100);
	border-color: var(--p-orange-300);
	color: var(--p-orange-700);
	font-weight: 600;
}
.hs-cat-pill.negative.active {
	background: color-mix(in srgb, var(--p-red-100) 60%, transparent);
	border-color: var(--p-red-300);
	color: var(--p-red-600);
}

:where(.my-app-dark, .my-app-dark *) .hs-cat-pill {
	border-color: var(--p-gray-600);
	background: transparent;
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-pill:hover {
	border-color: var(--p-gray-500);
	color: var(--p-gray-200);
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-pill.active {
	background: color-mix(in srgb, var(--p-orange-900) 35%, transparent);
	border-color: var(--p-orange-700);
	color: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-pill.negative.active {
	background: color-mix(in srgb, var(--p-red-900) 30%, transparent);
	border-color: var(--p-red-700);
	color: var(--p-red-400);
}

/* Category color dots */
.hs-cat-dot {
	width: 0.42rem;
	height: 0.42rem;
	border-radius: 50%;
	flex-shrink: 0;
}
.cat-sport { background: var(--p-green-500); }
.cat-health { background: var(--p-teal-500); }
.cat-work { background: var(--p-blue-500); }
.cat-learning { background: var(--p-purple-500); }
.cat-relax { background: var(--p-cyan-400); }
.cat-home { background: var(--p-orange-500); }
.cat-social { background: var(--p-pink-500); }
.cat-hobby { background: var(--p-yellow-500); }
.cat-finance { background: var(--p-green-700); }
.cat-tech { background: var(--p-blue-700); }
.cat-negative { background: var(--p-red-500); }

/* =====================================================
   RESULTS GRID
   ===================================================== */
.hs-results,
.hs-grouped {
	margin-top: 0.25rem;
}

.hs-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

/* =====================================================
   ITEM WRAPPER — holds HabbitItem + check overlay
   ===================================================== */
.hs-item-wrap {
	position: relative;
	cursor: pointer;
	transition: all 0.25s ease;
}
.hs-item-wrap.added {
	opacity: 0.45;
	pointer-events: none;
	transform: scale(0.95);
}

/* Checkmark overlay on added items */
.hs-check-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
	pointer-events: none;
}
.hs-check-overlay i {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	background: var(--p-green-500);
	color: white;
	font-size: 0.65rem;
	font-weight: 700;
	box-shadow: 0 2px 8px color-mix(in srgb, var(--p-green-500) 35%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-check-overlay i {
	background: var(--p-green-600);
}

/* Check animation */
.hs-check-enter-active {
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hs-check-leave-active {
	transition: all 0.2s ease;
}
.hs-check-enter-from {
	opacity: 0;
	transform: scale(0.3);
}
.hs-check-leave-to {
	opacity: 0;
	transform: scale(0.5);
}

/* =====================================================
   GROUPED VIEW — category sections
   ===================================================== */
.hs-grouped {
	display: flex;
	flex-direction: column;
	gap: 1.1rem;
}
.hs-group {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
}
.hs-group-head {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}
.hs-group-dot {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	flex-shrink: 0;
}
.hs-group-title {
	font-family: 'Lora', serif;
	font-size: 0.82rem;
	font-weight: 600;
	color: var(--p-gray-700);
	text-transform: capitalize;
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .hs-group-title {
	color: var(--p-gray-200);
}
.hs-group-count {
	font-size: 0.65rem;
	font-weight: 600;
	padding: 0.1rem 0.4rem;
	border-radius: 9999px;
	background: var(--p-orange-100);
	color: var(--p-orange-600);
	margin-left: 0.15rem;
}
:where(.my-app-dark, .my-app-dark *) .hs-group-count {
	background: color-mix(in srgb, var(--p-orange-900) 30%, transparent);
	color: var(--p-orange-400);
}

/* =====================================================
   EMPTY STATE
   ===================================================== */
.hs-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2rem 1rem;
	text-align: center;
}
.hs-empty-icon {
	font-size: 2rem;
	margin-bottom: 0.5rem;
}
.hs-empty-title {
	font-family: 'Lora', serif;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--p-gray-600);
	margin-bottom: 0.15rem;
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-title {
	color: var(--p-gray-300);
}
.hs-empty-text {
	font-size: 0.78rem;
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-text {
	color: var(--p-gray-500);
}
.hs-empty-link {
	border: none;
	background: none;
	color: var(--p-orange-500);
	font-weight: 600;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 2px;
	font-size: inherit;
	padding: 0;
}
.hs-empty-link:hover {
	color: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-link {
	color: var(--p-orange-400);
}

/* =====================================================
   TRANSITIONS
   ===================================================== */
.hs-slide-enter-active,
.hs-slide-leave-active {
	transition: all 0.25s ease;
	overflow: hidden;
}
.hs-slide-enter-from,
.hs-slide-leave-to {
	opacity: 0;
	max-height: 0;
}
.hs-slide-enter-to,
.hs-slide-leave-from {
	max-height: 10rem;
}

/* Legacy icon support */
.material-icons {
	font-family: "Material Icons";
}
</style>
