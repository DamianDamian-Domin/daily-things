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

			<div
				class="add-cats"
				role="group"
				aria-label="Categories">
				<button
					type="button"
					class="dt-chip"
					:aria-pressed="category === 'all'"
					@click="category = 'all'">
					All
				</button>
				<button
					v-for="cat in categories"
					:key="cat.key"
					type="button"
					class="dt-chip"
					:aria-pressed="category === cat.key"
					@click="category = category === cat.key ? 'all' : cat.key">
					<span aria-hidden="true">{{ cat.emoji }}</span>
					{{ cat.label }}
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
							class="negative-toggle">
							<input
								v-model="customNegative"
								type="checkbox" />
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

				<section
					v-for="section in sections"
					:key="section.key"
					class="add-section"
					:aria-label="section.title">
					<div class="add-section-head">
						<span aria-hidden="true">{{ section.emoji }}</span>
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

				<div
					v-if="query && sections.length === 0 && !creating"
					class="dt-empty">
					<PixelIcon
						icon="eco"
						palette="green"
						:size="40" />
					<p>Nothing called “{{ query }}” yet.</p>
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
						<small>Can't find it? Make it yours.</small>
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
import { computed, nextTick, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import type { Habbit } from "@/libs/types";
import { useHabbitsStore } from "@/stores/habbits";
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
import HabitTile from "@/components/home_view/HabitTile.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const props = defineProps<{ mode: "log" | "goal" }>();
const emit = defineEmits<{ (e: "logged"): void }>();
const visible = defineModel<boolean>({ default: false });

const habbitsStore = useHabbitsStore();
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

const query = ref("");
const category = ref<"all" | SuperCategoryKey>("all");
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

const categories = computed(() => {
	const list = SUPER_CATEGORIES.filter((c) => pool.value.some((h) => superCategoryOf(h)?.key === c.key));
	return habbitsStore.customHabbits.length ? [CUSTOM_CATEGORY, ...list] : list;
});

interface Section {
	key: string;
	title: string;
	emoji: string;
	items: Habbit[];
}

const sections = computed<Section[]>(() => {
	const q = normalizeText(query.value.trim());
	const inCategory = (h: Habbit) =>
		category.value === "all" || superCategoryOf(h)?.key === category.value;

	if (q) {
		const items = pool.value.filter((h) => inCategory(h) && matchesQuery(h, q));
		return items.length ? [{ key: "results", title: `${items.length} found`, emoji: "🔎", items }] : [];
	}

	if (category.value !== "all") {
		const cat = categories.value.find((c) => c.key === category.value);
		return [
			{
				key: String(category.value),
				title: cat?.label ?? "",
				emoji: cat?.emoji ?? "",
				items: pool.value.filter(inCategory),
			},
		];
	}

	const result: Section[] = [];
	const shown = new Set<string>();
	const take = (items: Habbit[]) => items.filter((h) => !shown.has(h.name) && shown.add(h.name));

	if (props.mode === "goal") {
		const current = [...new Set(habbitsStore.dailyGoalsList.map((g) => g.name))].map((name) =>
			habbitsStore.resolve({ name }),
		);
		if (current.length) result.push({ key: "current", title: "Your goals", emoji: "🎯", items: take(current) });
	}

	const custom = pool.value.filter((h) => h.origin === "user");
	if (custom.length) result.push({ key: "yours", title: "Your habits", emoji: "⭐", items: custom });
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
			emoji: "✨",
			items: suggestedItems,
		});

	for (const cat of SUPER_CATEGORIES) {
		const items = pool.value.filter((h) => h.origin !== "user" && superCategoryOf(h)?.key === cat.key);
		if (items.length) result.push({ key: cat.key, title: cat.label, emoji: cat.emoji, items });
	}
	return result;
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
	customNegative.value = false;
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

/* Na komputerze kategorie zawijają się w wiersze — przewijanie w poziomie
   bez paska jest dla myszki niewidoczne i niedostępne */
.add-cats {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	padding: 0.75rem 1.25rem 0.5rem;
	flex-shrink: 0;
}
.add-cats .dt-chip {
	padding: 0.3rem 0.7rem;
	font-size: var(--dt-text-sm);
}
/* Na telefonie jeden przewijany palcem rząd, z wygaszoną krawędzią
   sugerującą, że jest więcej */
@media (max-width: 640px), (hover: none) and (pointer: coarse) {
	.add-cats {
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
		mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent);
		-webkit-mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent);
	}
	.add-cats::-webkit-scrollbar {
		display: none;
	}
	/* Odstęp na końcu, żeby ostatni chip dało się w pełni przewinąć spod wygaszenia */
	.add-cats::after {
		content: "";
		flex: 0 0 1.5rem;
	}
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
	gap: 0.4rem;
	margin-bottom: 0.6rem;
	position: sticky;
	top: -0.5rem;
	z-index: 2;
	padding: 0.35rem 0;
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
}
.cell-mini i {
	font-size: 0.6rem;
}
.cell-mini:hover {
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
}
.cell-mini.is-delete {
	background: var(--dt-danger-soft);
	color: var(--dt-danger);
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
	transition:
		border-color 0.18s ease,
		background-color 0.18s ease;
}
.create-cta:hover {
	border-color: var(--dt-accent);
	background: var(--dt-accent-softer);
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
}
.icon-choice[aria-pressed="true"] {
	border-color: var(--dt-accent);
	background: var(--dt-accent-soft);
}
.negative-toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	cursor: pointer;
}
.negative-toggle input {
	width: 1.1rem;
	height: 1.1rem;
	accent-color: var(--dt-accent-strong);
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
