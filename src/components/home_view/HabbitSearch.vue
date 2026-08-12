<template>
	<div class="hs-root">
		<div class="hs-search-wrap">
			<i class="pi pi-search hs-search-icon"></i>
			<input
				v-model="searchQuery"
				:placeholder="searchPlaceholder"
				class="hs-search-input"
				type="text"
				autocomplete="off"
				spellcheck="false" />
			<button
				v-if="searchQuery"
				class="hs-search-clear"
				aria-label="Clear search"
				@click="searchQuery = ''">
				<i class="pi pi-times"></i>
			</button>
		</div>

		<div
			class="hs-cat-scroller"
			:class="{ 'has-active': activeCategories.length > 0 }">
			<div class="hs-cat-row">
				<button
					v-for="cat in superCategories"
					:key="cat.key"
					class="hs-cat-chip"
					:class="{ active: activeCategories.includes(cat.key) }"
					:aria-pressed="activeCategories.includes(cat.key)"
					@click="toggleCategory(cat.key)">
					<span class="hs-cat-emoji">{{ cat.emoji }}</span>
					<span class="hs-cat-label">{{ cat.label }}</span>
				</button>
				<Transition name="hs-clear">
					<button
						v-if="activeCategories.length > 0"
						class="hs-cat-chip is-reset"
						@click="clearFilters">
						<i class="pi pi-times" style="font-size: 0.65rem"></i>
						<span>Clear</span>
					</button>
				</Transition>
			</div>
		</div>

		<div class="hs-scroll">
			<section
				v-if="!searchQuery && suggestedHabits.length > 0 && activeCategories.length === 0"
				class="hs-section">
				<header class="hs-section-head">
					<span class="hs-section-emoji" aria-hidden="true">✨</span>
					<h4 class="hs-section-title">
						{{ hasRecent ? "Recently added" : "Great to start with" }}
					</h4>
				</header>
				<div class="hs-grid">
					<div
						v-for="habit in suggestedHabits"
						:key="'sug-' + habit.name"
						class="hs-cell"
						:class="{ added: isAdded(habit.name) }">
						<HabbitItem
							:data="displayData(habit)"
							:showLabel="true"
							:showTooltip="true"
							@click="onHabitClick(habit)" />
						<Transition name="hs-check">
							<div
								v-if="isAdded(habit.name)"
								class="hs-check"
								aria-hidden="true">
								<i class="pi pi-check"></i>
							</div>
						</Transition>
					</div>
				</div>
			</section>

			<template v-if="visibleGroups.length > 0">
				<section
					v-for="group in visibleGroups"
					:key="group.key"
					class="hs-section">
					<header class="hs-section-head">
						<span class="hs-section-emoji" aria-hidden="true">{{
							group.emoji
						}}</span>
						<h4 class="hs-section-title">{{ group.label }}</h4>
						<span class="hs-section-hint">{{ group.habits.length }}</span>
					</header>
					<div class="hs-grid">
						<div
							v-for="habit in group.habits"
							:key="group.key + '-' + habit.name"
							class="hs-cell"
							:class="{ added: isAdded(habit.name) }">
							<HabbitItem
								:data="displayData(habit)"
								:showLabel="true"
								:showTooltip="true"
								@click="onHabitClick(habit)" />
							<Transition name="hs-check">
								<div
									v-if="isAdded(habit.name)"
									class="hs-check"
									aria-hidden="true">
									<i class="pi pi-check"></i>
								</div>
							</Transition>
						</div>
					</div>
				</section>
			</template>

			<div
				v-else-if="searchQuery"
				class="hs-empty">
				<span class="hs-empty-icon" aria-hidden="true">🌿</span>
				<p class="hs-empty-title">Nothing matches "{{ searchQuery }}"</p>
				<button
					class="hs-empty-link"
					@click="clearFilters">
					Clear filters
				</button>
			</div>
			<div
				v-else-if="activeCategories.length > 0 && visibleGroups.length === 0"
				class="hs-empty">
				<span class="hs-empty-icon" aria-hidden="true">🗂️</span>
				<p class="hs-empty-title">Nothing in this filter</p>
				<button
					class="hs-empty-link"
					@click="clearFilters">
					Show all categories
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import HabbitItem from "./HabbitItem.vue";
import { Habbit } from "@/libs/types";

const habbitsStore = useHabbitsStore();

const props = defineProps<{
	addedNames?: string[];
	goalMode?: boolean;
}>();

const emit = defineEmits(["select"]);

// ==========================================================================
// Super-category configuration — consolidate 21 raw categories into 12.
// ==========================================================================
type SuperCategoryKey =
	| "fitness"
	| "health"
	| "food"
	| "mind"
	| "work"
	| "learning"
	| "home"
	| "social"
	| "life"
	| "pets"
	| "tech"
	| "finance";

interface SuperCategoryDef {
	key: SuperCategoryKey;
	label: string;
	emoji: string;
	sources: string[];
}

const SUPER_CATEGORIES: SuperCategoryDef[] = [
	{
		key: "fitness",
		label: "Fitness",
		emoji: "🏃",
		sources: ["Sports & Games", "Fitness & Movement"],
	},
	{
		key: "health",
		label: "Health & Body",
		emoji: "💪",
		sources: [
			"Personal Hygiene & Grooming",
			"Health Monitoring",
			"Body Care & Recovery",
			"Sleep & Routines",
		],
	},
	{ key: "food", label: "Food", emoji: "🍎", sources: ["Nutrition & Food"] },
	{
		key: "mind",
		label: "Mind",
		emoji: "🧘",
		sources: ["Mental Health & Mindfulness", "Spirituality & Reflection"],
	},
	{
		key: "work",
		label: "Work & Focus",
		emoji: "💼",
		sources: ["Productivity & Work"],
	},
	{
		key: "learning",
		label: "Learning",
		emoji: "📚",
		sources: ["Learning & Growth"],
	},
	{ key: "home", label: "Home", emoji: "🏡", sources: ["Home & Chores"] },
	{
		key: "social",
		label: "Social & Family",
		emoji: "👥",
		sources: ["Social & Community", "Family & Relationships"],
	},
	{
		key: "life",
		label: "Life & Play",
		emoji: "🎨",
		sources: [
			"Creativity & Hobbies",
			"Travel & Adventure",
			"Outdoors & Nature",
			"Transport & Car",
		],
	},
	{ key: "pets", label: "Pets", emoji: "🐾", sources: ["Pets"] },
	{ key: "tech", label: "Tech", emoji: "📱", sources: ["Digital Wellbeing & Tech"] },
	{ key: "finance", label: "Finance", emoji: "💰", sources: ["Finance"] },
];

const SOURCE_TO_SUPER: Record<string, SuperCategoryKey> = SUPER_CATEGORIES.reduce(
	(acc, def) => {
		for (const src of def.sources) acc[src] = def.key;
		return acc;
	},
	{} as Record<string, SuperCategoryKey>,
);

function superKeyFor(habit: Habbit): SuperCategoryKey | null {
	const raw = habit.category;
	if (!raw) return null;
	return SOURCE_TO_SUPER[raw] ?? null;
}

// ==========================================================================
// State
// ==========================================================================
const searchQuery = ref("");
const activeCategories = ref<SuperCategoryKey[]>([]);

// ==========================================================================
// Derived — categories with per-key counts, in a stable order
// ==========================================================================
const superCategories = computed(() => {
	const counts: Record<string, number> = {};
	for (const h of habbitsStore.allHabbitsList as Habbit[]) {
		if (!isAllowedForMode(h)) continue;
		const k = superKeyFor(h);
		if (k) counts[k] = (counts[k] ?? 0) + 1;
	}
	return SUPER_CATEGORIES.map((def) => ({ ...def, count: counts[def.key] ?? 0 }));
});

// ==========================================================================
// Search — diacritic-insensitive across name, display_name, and tags
// ==========================================================================
function normalize(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "");
}

const normalizedQuery = computed(() => normalize(searchQuery.value.trim()));

function matchesSearch(habit: Habbit): boolean {
	const q = normalizedQuery.value;
	if (!q) return true;
	if (normalize(habit.name).includes(q)) return true;
	if (habit.display_name && normalize(habit.display_name).includes(q)) return true;
	if (habit.tags?.some((t) => normalize(t).includes(q))) return true;
	return false;
}

// Goals can only be things you want to *do more of* — hide negative habits.
function isAllowedForMode(habit: Habbit): boolean {
	if (props.goalMode && habit.severity === "danger") return false;
	return true;
}

interface GroupView {
	key: SuperCategoryKey;
	label: string;
	emoji: string;
	habits: Habbit[];
}

const visibleGroups = computed<GroupView[]>(() => {
	const bySuper = new Map<SuperCategoryKey, Habbit[]>();
	const considered =
		activeCategories.value.length > 0
			? new Set(activeCategories.value)
			: new Set(SUPER_CATEGORIES.map((c) => c.key));

	for (const h of habbitsStore.allHabbitsList as Habbit[]) {
		const key = superKeyFor(h);
		if (!key || !considered.has(key)) continue;
		if (!isAllowedForMode(h)) continue;
		if (!matchesSearch(h)) continue;
		if (!bySuper.has(key)) bySuper.set(key, []);
		bySuper.get(key)!.push(h);
	}

	const groups: GroupView[] = [];
	for (const def of SUPER_CATEGORIES) {
		const habits = bySuper.get(def.key);
		if (!habits || habits.length === 0) continue;
		groups.push({ key: def.key, label: def.label, emoji: def.emoji, habits });
	}
	return groups;
});

// ==========================================================================
// Suggested — Recently added, or curated defaults for new users
// ==========================================================================
const hasRecent = computed(() => (habbitsStore.recentHabbits ?? []).length > 0);

const suggestedHabits = computed<Habbit[]>(() => {
	const all = habbitsStore.allHabbitsList as Habbit[];
	const recent = habbitsStore.recentHabbits ?? [];
	if (recent.length > 0) {
		return recent
			.map((name) => all.find((h) => h.name === name))
			.filter((h): h is Habbit => Boolean(h) && isAllowedForMode(h))
			.slice(0, 8);
	}
	return all.filter((h) => h.severity === "success").slice(0, 8);
});

const searchPlaceholder = computed(
	() => `Search ${habbitsStore.allHabbitsList.length} habits…`,
);

function toggleCategory(key: SuperCategoryKey) {
	const i = activeCategories.value.indexOf(key);
	if (i > -1) activeCategories.value.splice(i, 1);
	else activeCategories.value.push(key);
}

function clearFilters() {
	searchQuery.value = "";
	activeCategories.value = [];
}

function isAdded(name: string): boolean {
	return props.addedNames?.includes(name) ?? false;
}

function onHabitClick(habit: Habbit) {
	if (isAdded(habit.name)) return;
	emit("select", habit);
}

function displayData(habit: Habbit): Habbit {
	if (props.goalMode && !isAdded(habit.name)) {
		return { ...habit, severity: "empty" };
	}
	return habit;
}
</script>

<style scoped>
/* ==========================================================================
   ROOT — flex column, integrated with dialog shell
   ========================================================================== */
.hs-root {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	width: 100%;
	gap: 0.9rem;
}

/* ==========================================================================
   SEARCH — the focal element. Cushiony, centered, prominent.
   ========================================================================== */
.hs-search-wrap {
	position: relative;
	display: flex;
	align-items: center;
	flex-shrink: 0;
}
.hs-search-icon {
	position: absolute;
	left: 1rem;
	font-size: 0.95rem;
	color: var(--p-orange-400);
	pointer-events: none;
	z-index: 1;
}
:where(.my-app-dark, .my-app-dark *) .hs-search-icon {
	color: var(--p-orange-400);
}
.hs-search-input {
	width: 100%;
	height: 2.85rem;
	padding: 0 2.85rem 0 2.75rem;
	font-family: "Lora", serif;
	font-size: 0.95rem;
	color: var(--p-gray-800);
	background: color-mix(in srgb, white 65%, var(--p-orange-50));
	border: 1px solid color-mix(in srgb, var(--p-orange-200) 55%, transparent);
	border-radius: 0.85rem;
	outline: none;
	box-shadow: none;
	transition:
		border-color 0.2s ease,
		background 0.2s ease;
}
.hs-search-input::placeholder {
	color: var(--p-gray-400);
	font-weight: 400;
}
.hs-search-input:hover {
	border-color: color-mix(in srgb, var(--p-orange-300) 70%, transparent);
	background: white;
}
.hs-search-input:focus {
	border-color: var(--p-orange-400);
	background: white;
}
:where(.my-app-dark, .my-app-dark *) .hs-search-input {
	background: color-mix(in srgb, var(--p-gray-700) 55%, transparent);
	color: var(--p-gray-100);
	border-color: color-mix(in srgb, var(--p-gray-600) 70%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-input::placeholder {
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-input:hover {
	border-color: var(--p-gray-500);
	background: color-mix(in srgb, var(--p-gray-700) 75%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-input:focus {
	border-color: var(--p-orange-500);
	background: color-mix(in srgb, var(--p-gray-700) 75%, transparent);
}

.hs-search-clear {
	position: absolute;
	right: 0.75rem;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.65rem;
	height: 1.65rem;
	border-radius: 50%;
	border: none;
	background: var(--p-gray-100);
	color: var(--p-gray-500);
	font-size: 0.65rem;
	cursor: pointer;
	transition: all 0.18s ease;
}
.hs-search-clear:hover {
	background: var(--p-orange-100);
	color: var(--p-orange-600);
	transform: scale(1.08);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-clear {
	background: var(--p-gray-600);
	color: var(--p-gray-300);
}
:where(.my-app-dark, .my-app-dark *) .hs-search-clear:hover {
	background: var(--p-orange-800);
	color: var(--p-orange-200);
}

/* ==========================================================================
   CATEGORY CHIPS — wrap into rows, all visible at once
   ========================================================================== */
.hs-cat-scroller {
	flex-shrink: 0;
}

.hs-cat-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
	padding: 0.15rem 0 0.1rem;
}

.hs-cat-chip {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 0.85rem 0.5rem 0.7rem;
	border-radius: 9999px;
	border: 1px solid transparent;
	background: white;
	color: var(--p-gray-600);
	font-size: 0.78rem;
	font-weight: 500;
	cursor: pointer;
	white-space: nowrap;
	line-height: 1;
	user-select: none;
	transition:
		transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
		background 0.18s ease,
		color 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.hs-cat-chip:hover {
	color: var(--p-gray-900);
	transform: translateY(-1px);
	box-shadow: 0 4px 10px -2px rgba(251, 146, 60, 0.18);
}
.hs-cat-chip.active {
	background: var(--p-orange-500);
	color: white;
	box-shadow: 0 3px 10px -1px rgba(251, 146, 60, 0.4);
}
.hs-cat-chip.is-reset {
	background: transparent;
	border: 1px dashed color-mix(in srgb, var(--p-gray-400) 60%, transparent);
	color: var(--p-gray-500);
	box-shadow: none;
}
.hs-cat-chip.is-reset:hover {
	color: var(--p-gray-800);
	border-color: var(--p-gray-500);
	background: white;
	transform: none;
	box-shadow: none;
}

/* Clear chip fade-in / fade-out */
.hs-clear-enter-active {
	transition:
		opacity 0.22s ease,
		transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hs-clear-leave-active {
	transition:
		opacity 0.15s ease,
		transform 0.18s ease;
}
.hs-clear-enter-from,
.hs-clear-leave-to {
	opacity: 0;
	transform: scale(0.7);
}

:where(.my-app-dark, .my-app-dark *) .hs-cat-chip {
	background: color-mix(in srgb, var(--p-gray-700) 60%, transparent);
	color: var(--p-gray-200);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-chip:hover {
	color: white;
	background: color-mix(in srgb, var(--p-gray-700) 80%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-chip.active {
	background: var(--p-orange-500);
	color: white;
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-chip.is-reset {
	background: transparent;
	border-color: color-mix(in srgb, var(--p-gray-500) 60%, transparent);
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-cat-chip.is-reset:hover {
	color: var(--p-gray-100);
	border-color: var(--p-gray-400);
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
}

.hs-cat-emoji {
	font-size: 1rem;
	line-height: 1;
}
.hs-cat-label {
	line-height: 1;
}

/* ==========================================================================
   SCROLLABLE BODY
   ========================================================================== */
.hs-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding-top: 0.25rem;
	padding-right: 0.35rem;
	margin-right: -0.35rem;
	display: flex;
	flex-direction: column;
	gap: 1.6rem;
	scrollbar-width: thin;
	scrollbar-color: color-mix(in srgb, var(--p-orange-300) 40%, transparent)
		transparent;
}
.hs-scroll::-webkit-scrollbar {
	width: 5px;
}
.hs-scroll::-webkit-scrollbar-thumb {
	background: color-mix(in srgb, var(--p-orange-300) 40%, transparent);
	border-radius: 6px;
}
:where(.my-app-dark, .my-app-dark *) .hs-scroll::-webkit-scrollbar-thumb {
	background: color-mix(in srgb, var(--p-gray-500) 40%, transparent);
}

/* ==========================================================================
   SECTION — no borders, no badges. Just emoji + name + subtle count.
   ========================================================================== */
.hs-section {
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
}
.hs-section-head {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	padding: 0 0.1rem;
}
.hs-section-emoji {
	font-size: 1.1rem;
	line-height: 1;
	transform: translateY(2px);
}
.hs-section-title {
	font-family: "Lora", serif;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--p-gray-800);
	margin: 0;
	line-height: 1.2;
	letter-spacing: -0.005em;
}
:where(.my-app-dark, .my-app-dark *) .hs-section-title {
	color: var(--p-gray-100);
}
.hs-section-hint {
	font-size: 0.72rem;
	font-weight: 500;
	color: var(--p-gray-400);
	margin-left: auto;
	font-variant-numeric: tabular-nums;
}
:where(.my-app-dark, .my-app-dark *) .hs-section-hint {
	color: var(--p-gray-500);
}

/* ==========================================================================
   GRID — uniform tile density
   ========================================================================== */
.hs-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
	gap: 0.75rem 0.5rem;
	justify-items: center;
}

.hs-cell {
	position: relative;
	cursor: pointer;
	transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.hs-cell.added {
	pointer-events: none;
	transform: scale(0.94);
}
/* Fade only the tile itself — keep check overlay at full punch */
.hs-cell.added > :not(.hs-check) {
	opacity: 0.5;
	transition: opacity 0.22s ease;
}

.hs-check {
	position: absolute;
	top: 0.15rem;
	right: 0.15rem;
	z-index: 5;
	pointer-events: none;
}
.hs-check i {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.35rem;
	height: 1.35rem;
	border-radius: 50%;
	background: var(--p-green-500);
	color: white;
	font-size: 0.6rem;
	font-weight: 700;
	box-shadow:
		0 0 0 2px color-mix(in srgb, var(--p-orange-50) 80%, white),
		0 2px 8px color-mix(in srgb, var(--p-green-500) 45%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-check i {
	background: var(--p-emerald-400, var(--p-green-400));
	box-shadow:
		0 0 0 2px var(--p-gray-800),
		0 2px 10px color-mix(in srgb, var(--p-emerald-400, var(--p-green-400)) 55%, transparent);
}

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

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */
.hs-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 3rem 1rem 2rem;
	text-align: center;
	gap: 0.5rem;
}
.hs-empty-icon {
	font-size: 2.4rem;
	opacity: 0.9;
}
.hs-empty-title {
	font-family: "Lora", serif;
	font-size: 0.95rem;
	font-weight: 500;
	color: var(--p-gray-600);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-title {
	color: var(--p-gray-200);
}
.hs-empty-link {
	margin-top: 0.35rem;
	border: none;
	background: none;
	color: var(--p-orange-500);
	font-weight: 600;
	font-size: 0.85rem;
	cursor: pointer;
	padding: 0.4rem 0.85rem;
	border-radius: 9999px;
	transition: all 0.18s ease;
}
.hs-empty-link:hover {
	background: color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	color: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-link {
	color: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .hs-empty-link:hover {
	background: color-mix(in srgb, var(--p-orange-900) 40%, transparent);
	color: var(--p-orange-300);
}

/* Legacy icon font support (Material Icons used by HabbitItem) */
.material-icons {
	font-family: "Material Icons";
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
@media (max-width: 640px) {
	.hs-root {
		gap: 0.7rem;
	}
	.hs-search-input {
		height: 2.75rem;
		font-size: 0.9rem;
	}
	.hs-scroll {
		gap: 1.35rem;
	}
	.hs-grid {
		grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
		gap: 0.65rem 0.4rem;
	}
	.hs-section-title {
		font-size: 0.88rem;
	}
}
</style>
