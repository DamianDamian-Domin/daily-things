<template>
	<div class="flex flex-col gap-4 w-full">
		<!-- Pole tekstowe -->
		<InputText
			v-model="searchQuery"
			placeholder="Search by name..."
			class="w-full" />

		<!-- Kategorie tagów + Specjalne filtry -->

		<div class="flex flex-wrap gap-2">
			<!-- Specjalne filtry -->
			<Button
				v-for="filter in availableSpecialFilters"
				:key="filter"
				:label="filterLabelMap[filter]"
				size="small"
				:severity="selectedSpecialFilter === filter ? 'primary' : 'secondary'"
				@click="onSpecialFilterClick(filter)" />

			<!--Kategorie tagów -->
			<Button
				v-for="(tags, category) in tag_categories"
				:key="category"
				:label="category"
				:severity="
					category === 'negative'
						? 'danger'
						: selectedCategory === category
						? 'primary'
						: 'secondary'
				"
				@click="onCategoryClick(category)"
				size="small" />
		</div>

		<!-- Tagi (jeśli wybrano kategorię) -->
		<div
			v-if="availableTags.length"
			class="flex flex-wrap gap-2 mt-2">
			<Button
				v-for="tag in availableTags"
				:key="tag"
				:label="tag"
				:severity="selectedTags.includes(tag) ? 'primary' : 'secondary'"
				@click="toggleTag(tag)"
				size="small" />
		</div>

		<!-- Wyniki wyszukiwania -->
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
					@click="emit('select', habit)" />
			</div>
			<p
				v-else
				class="text-center text-gray-500 italic mt-2">
				You haven't added any habit yet. Add your first habit!
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
type TagCategory = keyof typeof habbitsStore.tag_categories;

import { ref, computed, onMounted } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { nextTick } from "vue";

const selectedCategory = ref<TagCategory | null>(null);
const selectedTags = ref<string[]>([]);
const searchQuery = ref("");
const habbitsStore = useHabbitsStore();
const tag_categories = habbitsStore.tag_categories;
const availableSpecialFilters = ["recently", "all"] as const;
const selectedSpecialFilter = ref<string | null>(null);
const filterLabelMap = {
	recently: "recently",
	all: "all",
} as const;

const emit = defineEmits(["select"]);

//Kategorie tagów

//Funkcja obsługująca kliknięcie kategorii
function onCategoryClick(category: TagCategory) {
	// Reset specjalnego filtra
	selectedSpecialFilter.value = null;

	if (selectedCategory.value === category) {
		// Odkliknięcie - reset wszystkiego
		selectedCategory.value = null;
		selectedTags.value = [];
	} else {
		// Resetujemy kategorię na null, żeby wyczyścić listę przed zmianą
		selectedCategory.value = null;
		selectedTags.value = [];

		nextTick(() => {
			// Po odświeżeniu DOM ustawiamy nową kategorię i tagi
			selectedCategory.value = category;
			selectedTags.value = [...tag_categories[category]];
		});
	}
}

//Tagi

// Wybrany tag
// Jeśli nie ma wybranego tagu, to będzie null
// Jeśli jest wybrana kategoria, to będzie tag z tej kategorii
const availableTags = computed(() =>
	selectedCategory.value ? tag_categories[selectedCategory.value] : []
);

// FUNKCJA do togglowania tagu w selectedTags
// Jeśli tag jest już w selectedTags, to go usuwamy, jeśli nie ma, to go dodajemy
// Dzięki temu możemy łatwo dodawać i usuwać tagi z listy
function toggleTag(tag: string) {
	const index = selectedTags.value.indexOf(tag);
	if (index === -1) {
		selectedTags.value.push(tag);
	} else {
		selectedTags.value.splice(index, 1);
	}
}

// Habbity

// Funkcja do filtrowania habbitów
// Filtrowanie odbywa się na podstawie wyszukiwania, tagów i specjalnych filtrów
// Jeśli wybrano filtr "recently", to zwracamy tylko te habbity, które są w liście recentHabbits
// W przeciwnym razie zwracamy habbity, które pasują do wyszukiwania i tagów
const filteredHabbits = computed(() => {
	// Obsługa filtra "recently"
	if (selectedSpecialFilter.value === "recently") {
		return habbitsStore.allHabbitsList.filter((habbit) =>
			habbitsStore.recentHabbits.includes(habbit.name)
		);
	}
	// Standardowe filtrowanie po wyszukiwaniu i tagach
	return habbitsStore.allHabbitsList.filter((habbit) => {
		const matchesText =
			searchQuery.value === "" ||
			habbit.name.toLowerCase().includes(searchQuery.value.toLowerCase());

		const matchesTags =
			selectedTags.value.length === 0
				? true
				: habbit.tags.some((tag) => selectedTags.value.includes(tag));

		return matchesText && matchesTags;
	});
});

// Sprawdzenie, czy jest aktywne wyszukiwanie
const isSearching = computed(() => {
	return (
		(searchQuery.value?.trim().length ?? 0) > 0 || selectedTags.value.length > 0
	);
});

// Sprawdzenie, czy jest wybrany specjalny filtr
// Jeśli jest wybrany filtr "recently", to zwracamy true
// W przeciwnym razie zwracamy false
function onSpecialFilterClick(filter: string) {
	if (selectedSpecialFilter.value === filter) {
		// Odznaczamy filtr, jeśli jest już wybrany
		selectedSpecialFilter.value = null;
	} else {
		selectedSpecialFilter.value = filter;
	}

	// Reset kategorii i tagów
	selectedCategory.value = null;
	selectedTags.value = [];
}
</script>

<style scoped>
.material-icons {
	font-family: "Material Icons";
}
</style>
