<template>
	<div>
		<p>Special filters</p>
		<div class="mb-2 mt-2">
			<SelectButton
				v-model="selectedSpecialFilter"
				:options="habbitsStore.specialFilters"
				optionLabel="display_name"
				dataKey="name"
				optionValue="name"
				@change="onSpecialFilterChange"
				class="w-full flex flex-wrap gap-2 justify-center md:justify-start rounded-full">
				<template #option="slotProps">
					<p :class="[slotProps.option.icon, 'mr-2 rounded-full']"></p>
					{{ slotProps.option.name }}
				</template>
			</SelectButton>
		</div>
	</div>
	<div class="flex flex-col gap-4 w-full">
		<!-- Search input -->
		<InputText
			v-model="searchQuery"
			placeholder="Search by name..."
			class="w-full" />

		<!-- Tag categories + special filters -->
		<div>
			<p>Categories</p>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button
				v-for="(tags, category) in tag_categories"
				:key="category"
				:label="category"
				:severity="
					category === 'negative'
						? 'danger'
						: isCategoryActive(category)
						? 'primary'
						: selectedCategory === category
						? 'primary'
						: 'secondary'
				"
				@click="onCategoryClick(category)"
				size="small" />
		</div>

		<!-- Tags (when a category is selected) -->
		<div
			v-if="availableTags.length"
			class="mt-2">
			<p class="mb-2">Tags</p>

			<div class="flex flex-wrap gap-2 mb-2">
				<button
					v-for="tag in availableTags"
					:key="tag"
					@click="toggleTag(tag)"
					class="transition-all duration-200 cursor-pointer select-none text-sm italic"
					:class="
						selectedTags.includes(tag)
							? 'text-primary underline font-semibold'
							: 'text-gray-500 hover:text-primary'
					">
					{{ tag }}
				</button>
			</div>
		</div>

		<!-- Search results -->
		<div
			v-if="isSearching || selectedSpecialFilter === 'recently'"
			class="flex flex-col w-full gap-4">
			<div
				v-if="filteredHabbits.length > 0"
				class="flex flex-row flex-wrap h-min gap-2">
				<HabbitItem
					v-for="habit in filteredHabbits"
					:key="habit.name"
					:data="habit"
					:showLabel="true"
					@click="emit('select', habit)" />
			</div>
			<p
				v-else
				class="text-center text-gray-500 italic mt-2">
				You haven't added any habit yet. Add your first habit!
			</p>
		</div>

		<!-- Habit list grouped by categories (ALL) -->
		<div
			v-else-if="selectedSpecialFilter === 'all'"
			class="flex flex-col w-full gap-6">
			<div
				v-for="(habits, category) in groupedHabbitsByCategory"
				:key="category"
				class="flex flex-col gap-2">
				<h2 class="font-semibold text-gray-700 capitalize italic">
					{{ category }}
				</h2>

				<div class="flex flex-row flex-wrap gap-2">
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
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
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

// Initialize selectedSpecialFilter on component mount
// If there are recentHabbits, set it to "recently", otherwise "all"
if (habbitsStore.recentHabbits && habbitsStore.recentHabbits.length > 0) {
	selectedSpecialFilter.value = "recently";
} else {
	selectedSpecialFilter.value = "all";
}

// Initialize selectedSpecialFilter on component mount
// If there are recentHabbits, set it to "recently", otherwise "all"
if (habbitsStore.recentHabbits && habbitsStore.recentHabbits.length > 0) {
	selectedSpecialFilter.value = "recently";
} else {
	selectedSpecialFilter.value = "all";
}

// Special filters

// Handles special filter change
// Resets category and tags when filter changes
// If the same filter is clicked again, it disables it
function onSpecialFilterChange(event: any) {
	// If the same filter is clicked again -> disable it
	if (event.originalEvent && selectedSpecialFilter.value === event.value) {
		selectedSpecialFilter.value = null;
		activeCategories.value = [];
		return;
	}
	// event.value contains the newly selected filter
	selectedSpecialFilter.value = event.value;
	if (event.value === "all") {
		activeCategories.value = Object.keys(tag_categories);
	} else {
		activeCategories.value = [];
	}

	// Reset category and tags
	selectedCategory.value = null;
	selectedTags.value = [];

	// console.log(activeCategories.value);
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
.material-icons {
	font-family: "Material Icons";
}
</style>
