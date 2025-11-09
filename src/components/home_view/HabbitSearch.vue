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
		<!-- Pole tekstowe -->
		<InputText
			v-model="searchQuery"
			placeholder="Search by name..."
			class="w-full" />

		<!-- Kategorie tagów + Specjalne filtry -->
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

		<!-- Tagi (jeśli wybrano kategorię) -->
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
					:showLabel="true"
					@click="emit('select', habit)" />
			</div>
			<p
				v-else
				class="text-center text-gray-500 italic mt-2">
				You haven't added any habit yet. Add your first habit!
			</p>
		</div>

		<!-- Lista habitów pogrupowana po kategoriach (ALL) -->
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

// Inicjalizacja selectedSpecialFilter przy montowaniu komponentu
// Jeśli są recentHabbits, to ustawiamy na "recently", w przeciwnym razie na "all"
if (habbitsStore.recentHabbits && habbitsStore.recentHabbits.length > 0) {
	selectedSpecialFilter.value = "recently";
} else {
	selectedSpecialFilter.value = "all";
}

// Inicjalizacja selectedSpecialFilter przy montowaniu komponentu
// Jeśli są recentHabbits, to ustawiamy na "recently", w przeciwnym razie na "all"
if (habbitsStore.recentHabbits && habbitsStore.recentHabbits.length > 0) {
	selectedSpecialFilter.value = "recently";
} else {
	selectedSpecialFilter.value = "all";
}

// Specjalne filtry

// Funkcja obsługująca zmianę specjalnego filtra
// Resetuje kategorię i tagi przy zmianie filtra
// Jeśli kliknięto ponownie ten sam filtr, to go wyłącza
function onSpecialFilterChange(event: any) {
	// Jeśli kliknięto ponownie ten sam filtr → wyłącz go
	if (event.originalEvent && selectedSpecialFilter.value === event.value) {
		selectedSpecialFilter.value = null;
		activeCategories.value = [];
		return;
	}
	// event.value zawiera nowy wybrany filtr
	selectedSpecialFilter.value = event.value;
	if (event.value === "all") {
		activeCategories.value = Object.keys(tag_categories);
	} else {
		activeCategories.value = [];
	}

	// Reset kategorii i tagów
	selectedCategory.value = null;
	selectedTags.value = [];

	// console.log(activeCategories.value);
}

//Kategorie

// Sprawdzenie, czy kategoria jest aktywna (dla przycisków)
// Zwraca true, jeśli kategoria jest w activeCategories
// computed - automatycznie aktualizuje się przy zmianie activeCategories
// Używane do ustawiania stylu przycisków kategorii
const isCategoryActive = (category: string) =>
	activeCategories.value.includes(category);

// Funkcja do trzymania kategorii w activeCategories
// Jeśli kategoria jest już w activeCategories, to ją usuwamy, jeśli nie ma, to ją dodajemy
// Dzięki temu możemy łatwo dodawać i usuwać kategorie z listy
function toggleCategory(category: string) {
	const index = activeCategories.value.indexOf(category);
	if (index > -1) {
		activeCategories.value.splice(index, 1);
	} else {
		activeCategories.value.push(category);
	}
}

//Funkcja obsługująca kliknięcie kategorii
// Resetuje specjalny filtr i ustawia wybraną kategorię oraz tagi
// Jeśli kliknięto ponownie tę samą kategorię, to ją odznacza i resetuje tagi
// Używa nextTick, aby poczekać na odświeżenie DOM przed ustawieniem nowej kategorii i tagów
function onCategoryClick(category: TagCategory) {
	// Obsługa filtra "all" - pozwala na wielokrotny wybór kategorii
	// bez zmiany selectedCategory i selectedTags
	if (selectedSpecialFilter.value === "all") {
		toggleCategory(category);

		console.log("OnCategoryClick", activeCategories.value);
		return; // kończymy funkcję — nic więcej nie robimy
	}

	// Reset specjalnego filtra
	selectedSpecialFilter.value = null;
	activeCategories.value = [];

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

// Funkcja do określenia kategorii habbitu na podstawie jego tagów
// Przechodzi przez wszystkie kategorie i ich tagi
// Jeśli habbit ma tag z danej kategorii, to zwraca tę kategorię
// Jeśli nie pasuje do żadnej kategorii, to zwraca "other"
function getCategoryForHabit(habit: Habbit): string {
	for (const [category, tags] of Object.entries(tag_categories)) {
		if (habit.tags.some((tag) => tags.includes(tag))) {
			return category;
		}
	}
	return "other";
}

//Tagi

// Wybrany tag
// Lista dostępnych tagów na podstawie wybranej kategorii
// Jeśli nie wybrano kategorii, to lista jest pusta
// Jeśli wybrano kategorię, to lista zawiera tagi z tej kategorii
// computed - automatycznie aktualizuje się przy zmianie selectedCategory
const availableTags = computed(() => {
	return selectedCategory.value ? tag_categories[selectedCategory.value] : [];
});

// Funkcja do trzymania tagu w selectedTags
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
	let baseList = habbitsStore.allHabbitsList;

	//  Specjalne filtry
	if (selectedSpecialFilter.value === "recently") {
		// Pokazujemy tylko ostatnio używane habbity
		baseList = baseList.filter((habbit) =>
			habbitsStore.recentHabbits.includes(habbit.name)
		);
	} else if (selectedSpecialFilter.value === "all") {
		// Pokazujemy wszystkie habbity (bez ograniczania)
		baseList = habbitsStore.allHabbitsList;
	}
	// (tu można dodać inne filtry w przyszłości, np. "user")

	// Filtry wyszukiwania, tagów i kategorii
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

// Funkcja do grupowania habbitów po kategoriach
// Przechodzi przez wszystkie habbity i przypisuje je do odpowiednich kategorii
// Następnie filtruje kategorie na podstawie activeCategories
// Zwraca obiekt z kategoriami jako kluczami i tablicami habbitów jako wartościami
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

// Funkcje pomocnicze

// Sprawdzenie, czy jest aktywne wyszukiwanie
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
