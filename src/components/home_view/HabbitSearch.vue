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
				@click="
					selectedCategory = selectedCategory === category ? null : category
				"
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
				:severity="selectedTag === tag ? 'primary' : 'secondary'"
				@click="selectedTag = selectedTag === tag ? null : tag"
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

<script setup>
import { ref, computed } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";

import InputText from "primevue/inputtext";
import Button from "primevue/button";

const selectedCategory = ref(null);
const selectedTag = ref("");
const searchQuery = ref("");
const habbitsStore = useHabbitsStore();
const tag_categories = habbitsStore.tag_categories;
const emit = defineEmits(["select"]);

const availableTags = computed(() =>
	selectedCategory.value ? tag_categories[selectedCategory.value] : []
);

const filteredHabbits = computed(() => {
	return habbitsStore.allHabbitsList.filter((habbit) => {
		const matchesText =
			searchQuery.value === "" ||
			habbit.name.toLowerCase().includes(searchQuery.value.toLowerCase());

		const matchesTag =
			!selectedTag.value || habbit.tags.includes(selectedTag.value);

		return matchesText && matchesTag;
	});
});

const isSearching = computed(() => {
	return (
		(searchQuery.value?.trim().length ?? 0) > 0 ||
		(selectedTag.value?.length ?? 0) > 0
	);
});
</script>

<style scoped>
.material-icons {
	font-family: "Material Icons";
}
</style>
