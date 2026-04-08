<template>
	<div class="hs-root">
		<!-- Filter tabs — Recently / All / User -->
		<div class="hs-filter-tabs">
			<button
				v-for="filter in habbitsStore.specialFilters"
				:key="filter.name"
				class="hs-tab"
				:class="{ active: selectedSpecialFilter === filter.name }"
				@click="onTabClick(filter.name)">
				<i :class="filter.icon" class="hs-tab-icon"></i>
				<span>{{ filter.display_name }}</span>
			</button>
		</div>

		<!-- Search bar -->
		<div class="hs-search-wrap">
			<i class="pi pi-search hs-search-icon"></i>
			<InputText
				v-model="searchQuery"
				placeholder="Search habits..."
				class="hs-search-input w-full" />
		</div>

		<!-- Category pills -->
		<div class="hs-categories">
			<button
				v-for="(tags, category) in tag_categories"
				:key="category"
				class="hs-cat-pill"
				:class="{
					active: isCategoryActive(category) || selectedCategory === category,
					negative: category === 'negative' && (isCategoryActive(category) || selectedCategory === category),
				}"
				@click="onCategoryClick(category)">
				<span class="hs-cat-dot" :class="'cat-' + category"></span>
				{{ category }}
			</button>
		</div>

		<!-- Tags (when a category is selected) -->
		<Transition name="hs-slide">
			<div v-if="availableTags.length" class="hs-tags-area">
				<div class="hs-tags-list">
					<button
						v-for="tag in availableTags"
						:key="tag"
						class="hs-tag"
						:class="{ active: selectedTags.includes(tag) }"
						@click="toggleTag(tag)">
						#{{ tag }}
					</button>
				</div>
			</div>
		</Transition>

		<!-- Results — search / recently filtered -->
		<div
			v-if="isSearching || selectedSpecialFilter === 'recently'"
			class="hs-results">
			<div v-if="filteredHabbits.length > 0" class="hs-grid">
				<HabbitItem
					v-for="habit in filteredHabbits"
					:key="habit.name"
					:data="habit"
					:showLabel="true"
					@click="emit('select', habit)" />
			</div>
			<div v-else class="hs-empty">
				<span class="hs-empty-icon">🔍</span>
				<p class="hs-empty-title">No habits found</p>
				<p class="hs-empty-text">Try a different search or category</p>
			</div>
		</div>

		<!-- Results — grouped by category (ALL view) -->
		<div
			v-else-if="selectedSpecialFilter === 'all'"
			class="hs-grouped">
			<div
				v-for="(habits, category) in groupedHabbitsByCategory"
				:key="category"
				class="hs-group">
				<div class="hs-group-head">
					<span class="hs-group-dot" :class="'cat-' + category"></span>
					<h4 class="hs-group-title">{{ category }}</h4>
					<span class="hs-group-count">{{ habits.length }}</span>
				</div>
				<div class="hs-grid">
					<HabbitItem
						v-for="habit in habits"
						:key="habit.name"
						:data="habit"
						:showLabel="true"
						@click="emit('select', habit)" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";
import InputText from "primevue/inputtext";
import { Habbit } from "@/libs/types";

const habbitsStore = useHabbitsStore();
const tag_categories = habbitsStore.tag_categories;
type TagCategory = keyof typeof tag_categories;

const selectedCategory = ref<TagCategory | null>(null);
const selectedTags = ref<string[]>([]);
const searchQuery = ref("");
const selectedSpecialFilter = ref<string | null>(null);
const activeCategories = ref<string[]>([]);

const emit = defineEmits(["select"]);

// Initialize: show "recently" if available, otherwise "all"
if (habbitsStore.recentHabbits && habbitsStore.recentHabbits.length > 0) {
	selectedSpecialFilter.value = "recently";
} else {
	selectedSpecialFilter.value = "all";
}

// Tab click handler — toggle or switch special filter
function onTabClick(filterName: string) {
	if (selectedSpecialFilter.value === filterName) {
		// Clicking the active tab deselects it
		selectedSpecialFilter.value = null;
		activeCategories.value = [];
		return;
	}
	selectedSpecialFilter.value = filterName;
	if (filterName === "all") {
		activeCategories.value = Object.keys(tag_categories);
	} else {
		activeCategories.value = [];
	}
	// Reset category and tags
	selectedCategory.value = null;
	selectedTags.value = [];
}

// Categories

// Check if a category is active (for buttons)
// Returns true if category is in activeCategories
// computed - automatically updates when activeCategories changes
// Used to set category button styles
const isCategoryActive = (category: string) =>
	activeCategories.value.includes(category);

// Toggle category in activeCategories
// If category is already in activeCategories, remove it; otherwise add it
// This makes adding/removing categories easy
function toggleCategory(category: string) {
	const index = activeCategories.value.indexOf(category);
	if (index > -1) {
		activeCategories.value.splice(index, 1);
	} else {
		activeCategories.value.push(category);
	}
}

// Handles category click
// Resets special filter and sets selected category and tags
// If the same category is clicked again, deselect it and reset tags
// Uses nextTick to wait for DOM refresh before setting values
function onCategoryClick(category: TagCategory) {
	// Handle "all" filter - allow selecting multiple categories
	// without changing selectedCategory and selectedTags
	if (selectedSpecialFilter.value === "all") {
		toggleCategory(category);

		console.log("OnCategoryClick", activeCategories.value);
		return; // end function — do nothing else
	}

	// Reset special filter
	selectedSpecialFilter.value = null;
	activeCategories.value = [];

	if (selectedCategory.value === category) {
		// Deselect - reset everything
		selectedCategory.value = null;
		selectedTags.value = [];
	} else {
		// Reset category to null to clear list before changing
		selectedCategory.value = null;
		selectedTags.value = [];

		nextTick(() => {
			// After DOM refresh, set new category and tags
			selectedCategory.value = category;
			selectedTags.value = [...tag_categories[category]];
		});
	}
}

// Determine habit category based on its tags
// Iterate over all categories and their tags
// If habit has a tag from a category, return that category
// If no category matches, return "other"
function getCategoryForHabit(habit: Habbit): string {
	for (const [category, tags] of Object.entries(tag_categories)) {
		if (habit.tags.some((tag) => tags.includes(tag))) {
			return category;
		}
	}
	return "other";
}

// Tags

// Selected tag
// List of available tags based on selected category
// If no category is selected, list is empty
// If category is selected, list contains its tags
// computed - automatically updates when selectedCategory changes
const availableTags = computed(() => {
	return selectedCategory.value ? tag_categories[selectedCategory.value] : [];
});

// Toggle tag in selectedTags
// If tag is already in selectedTags, remove it; otherwise add it
// This makes adding/removing tags easy
function toggleTag(tag: string) {
	const index = selectedTags.value.indexOf(tag);
	if (index === -1) {
		selectedTags.value.push(tag);
	} else {
		selectedTags.value.splice(index, 1);
	}
}

// Habits

// Habit filtering function
// Filtering is based on search query, tags, and special filters
// If "recently" is selected, return only habits from recentHabbits
// Otherwise return habits matching search and tags
const filteredHabbits = computed(() => {
	let baseList = habbitsStore.allHabbitsList;

	//  Specjalne filtry
	if (selectedSpecialFilter.value === "recently") {
		// Show only recently used habits
		baseList = baseList.filter((habbit) =>
			habbitsStore.recentHabbits.includes(habbit.name)
		);
	} else if (selectedSpecialFilter.value === "all") {
		// Show all habits (no limitation)
		baseList = habbitsStore.allHabbitsList;
	}
	// (other filters can be added here in the future, e.g. "user")

	// Search, tag, and category filters
	return baseList.filter((habbit) => {
		const matchesSearch =
			searchQuery.value === "" ||
			habbit.name.toLowerCase().includes(searchQuery.value.toLowerCase());

		const matchesTags =
			selectedTags.value.length === 0
				? true
				: habbit.tags.some((tag) => selectedTags.value.includes(tag));

		const matchesCategory =
			selectedCategory.value === null
				? true
				: habbit.tags.some((tag) =>
						tag_categories[selectedCategory.value!].includes(tag)
				  );

		return matchesSearch && matchesTags && matchesCategory;
	});
});

// Group habits by category
// Iterate through all habits and assign them to categories
// Then filter categories based on activeCategories
// Return object with categories as keys and habit arrays as values
const groupedHabbitsByCategory = computed(() => {
	const grouped: Record<string, Habbit[]> = {};

	habbitsStore.allHabbitsList.forEach((habit) => {
		const category = getCategoryForHabit(habit);
		if (!grouped[category]) {
			grouped[category] = [];
		}
		grouped[category].push(habit);
	});

	const filtered: Record<string, Habbit[]> = {};

	for (const [category, habits] of Object.entries(grouped)) {
		if (activeCategories.value.includes(category)) {
			filtered[category] = habits;
		}
	}

	return filtered;
});

// Helper functions

// Check whether search is active
const isSearching = computed(() => {
	return (
		(searchQuery.value?.trim().length ?? 0) > 0 || selectedTags.value.length > 0
	);
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
   SEARCH BAR — with inline icon
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
}

/* =====================================================
   CATEGORY PILLS — horizontal scrollable chips
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

/* Category dot — color indicator */
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
   TAG CLOUD — hashtag pills
   ===================================================== */
.hs-tags-area {
	padding: 0.55rem 0.75rem;
	border-radius: 0.65rem;
	background: var(--p-orange-50);
}
:where(.my-app-dark, .my-app-dark *) .hs-tags-area {
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
}
.hs-tags-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
}
.hs-tag {
	padding: 0.2rem 0.55rem;
	border-radius: 9999px;
	border: none;
	background: white;
	color: var(--p-gray-500);
	font-size: 0.68rem;
	font-style: italic;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	user-select: none;
}
.hs-tag:hover {
	color: var(--p-orange-600);
	background: var(--p-orange-100);
}
.hs-tag.active {
	background: var(--p-orange-200);
	color: var(--p-orange-700);
	font-weight: 600;
}
:where(.my-app-dark, .my-app-dark *) .hs-tag {
	background: var(--p-gray-700);
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-tag:hover {
	background: var(--p-gray-600);
	color: var(--p-gray-200);
}
:where(.my-app-dark, .my-app-dark *) .hs-tag.active {
	background: color-mix(in srgb, var(--p-orange-800) 45%, transparent);
	color: var(--p-orange-300);
}

/* =====================================================
   RESULTS GRID — habit items
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
   EMPTY STATE — friendly no-results
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

/* =====================================================
   TRANSITIONS
   ===================================================== */
.hs-slide-enter-active,
.hs-slide-leave-active {
	transition: all 0.25s ease;
}
.hs-slide-enter-from,
.hs-slide-leave-to {
	opacity: 0;
	transform: translateY(-6px);
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
