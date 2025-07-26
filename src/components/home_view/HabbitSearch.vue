<template>
	<div class="flex flex-col gap-4 w-full">
		<!-- Pole tekstowe -->
		<InputText
			v-model="searchQuery"
			placeholder="Wyszukaj na podstawie nazwy..."
			class="w-full" />

		<!-- Kategorie tagów -->
		<div class="flex flex-wrap gap-2">
			<Button
				v-for="(tags, category) in tag_categories"
				:key="category"
				:label="category"
				:severity="selectedCategory === category ? 'primary' : 'secondary'"
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
			v-if="isSearching"
			class="flex flex-row flex-wrap h-min gap-2">
			<HabbitItem
				v-for="habit in filteredHabbits"
				:key="habit.name"
				:data="habit"
				@click="emit('select', habit)"></HabbitItem>
		</div>
	</div>
</template>

<script setup lang="ts">
type TagCategory = keyof typeof habbitsStore.tag_categories;

import { ref, computed } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const selectedCategory = ref<TagCategory | null>(null);
const selectedTags = ref<string[]>([]);
const searchQuery = ref("");
const habbitsStore = useHabbitsStore();
const tag_categories = habbitsStore.tag_categories;
const emit = defineEmits(["select"]);

// Wybrany tag
// Jeśli nie ma wybranego tagu, to będzie null
// Jeśli jest wybrana kategoria, to będzie tag z tej kategorii
const availableTags = computed(() =>
	selectedCategory.value ? tag_categories[selectedCategory.value] : []
);

// FUNKCJA do togglowania tagu w selectedTags
function toggleTag(tag: string) {
	const index = selectedTags.value.indexOf(tag);
	if (index === -1) {
		selectedTags.value.push(tag);
	} else {
		selectedTags.value.splice(index, 1);
	}
}

// NOWA funkcja obsługująca kliknięcie kategorii
function onCategoryClick(category: TagCategory) {
	if (selectedCategory.value === category) {
		// Odkliknięcie - reset wszystkiego
		selectedCategory.value = null;
		selectedTags.value = [];
	} else {
		// Zmiana kategorii - ustaw kategorię i zaznacz wszystkie jej tagi
		selectedCategory.value = category;
		selectedTags.value = [...tag_categories[category]];
	}
}

const filteredHabbits = computed(() => {
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
