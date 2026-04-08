<template>
	<Dialog
		v-model:visible="showHabbitDialog"
		modal
		dismissableMask
		:closable="true"
		:show-header="false"
		class="hs-dialog w-[clamp(22rem,85vw,42rem)]">
		<!-- Dialog hero header -->
		<div class="hs-dialog-hero">
			<div class="hs-dialog-hero-bg" aria-hidden="true"></div>
			<span class="hs-dialog-emoji">{{ addDialogMode === 'habbit' ? '🌱' : '🎯' }}</span>
			<h3 class="hs-dialog-title">{{ headerText }}</h3>
			<p class="hs-dialog-subtitle">
				{{ addDialogMode === 'habbit'
					? 'Find and pick habits to track today'
					: 'Choose a goal you want to achieve' }}
			</p>
		</div>
		<!-- Search content -->
		<div class="hs-dialog-body">
			<HabbitSearch
				:addedNames="addedInSession"
				@select="handleHabbitSelect" />
		</div>
		<!-- Done footer with counter -->
		<div class="hs-dialog-footer">
			<Transition name="hs-badge">
				<span v-if="addedInSession.length > 0" class="hs-added-badge">
					{{ addedInSession.length }} added ✓
				</span>
			</Transition>
			<button class="hs-done-btn" @click="showHabbitDialog = false">
				Done
			</button>
		</div>
	</Dialog>
	<div
		class="card-root"
		:data-active="isActive">
		<div
			class="flex flex-col justify-between card-a sm:w-[480px] surface-content w-full h-full min-h-[30rem] max-h-[50rem] overflow-auto"
			@click.capture="handleGlobalClick">
			<!-- Top area: greeting + habits -->
			<div>
				<!-- Greeting + streak -->
				<div class="hc-greeting-area">
					<div>
						<span class="hc-greeting-hello">{{ greetingEmoji }}</span>
						<h2 class="hc-greeting-text">{{ greetingText }}</h2>
					</div>
					<div v-if="streak > 0" class="hc-streak" v-tooltip.bottom="streak + ' day streak'">
						<span class="hc-streak-fire">🔥</span>
						<span class="hc-streak-num">{{ streak }}</span>
					</div>
				</div>

				<!-- Habits counter -->
				<div class="hc-header">
					<template v-if="selectedDayHabbits.length > 0">
						<span class="hc-count">{{ selectedDayHabbits.length }}</span>
						<span class="hc-count-label">{{ selectedDayHabbits.length === 1 ? 'habit' : 'habits' }} tracked ✨</span>
					</template>
					<p v-else class="hc-encourage">
						Tap <span class="hc-plus-badge">+</span> to start tracking 🌱
					</p>
				</div>

				<!-- Tracked habits -->
				<div class="tasks-area mt-4">
					<div class="flex flex-row flex-wrap h-min gap-3">
						<draggable
							v-model="selectedDayHabbits"
							item-key="id"
							class="flex flex-row flex-wrap h-min gap-3"
							ghost-class="opacity-40"
							:animation="150"
							@end="habbitsStore.updateHabbitsOrderInFirestore">
							<template #item="{ element }">
								<HabbitItem
									:data="getHabbitDisplayData(element)"
									:showTooltip="!editMode"
									@click="() => toggleMarkHabbit(element)" />
							</template>
						</draggable>
						<HabbitItem
							@click="openAddHabbitDialog"
							:showTooltip="!editMode"
							:data="{ severity: 'empty', icon: 'add', name: 'add' }" />
					</div>
				</div>
			</div>

			<!-- Goals section -->
			<div class="hc-goals-section">
				<div class="hc-goals-header">
					<div class="hc-goals-header-left">
						<!-- Kółko postępu celów -->
						<div
							v-if="totalGoals > 0"
							class="hc-goals-ring"
							:style="goalsRingStyle">
							<div class="hc-goals-ring-inner">
								<span class="hc-goals-ring-text">{{ completedGoals }}/{{ totalGoals }}</span>
							</div>
						</div>
						<h3 class="hc-goals-title">Daily goals 🎯</h3>
					</div>
					<button
						class="hc-edit-pill"
						:class="{ active: editMode }"
						@click="toggleEditMode">
						<i class="pi" :class="editMode ? 'pi-check' : 'pi-pencil'" style="font-size: 0.6rem"></i>
						{{ editMode ? 'Done' : 'Edit' }}
					</button>
				</div>
				<div
					ref="goalsContainerRef"
					class="flex flex-row flex-wrap h-min gap-3">
					<draggable
						v-if="editMode"
						v-model="dailyGoalsList"
						item-key="id"
						class="flex flex-row flex-wrap gap-3"
						ghost-class="opacity-40"
						:animation="150"
						@end="habbitsStore.updateGoalsOrderInFirestore">
						<template #item="{ element: goal }">
							<HabbitItem
								:data="getGoalDisplayData(goal)"
								:showTooltip="!editMode"
								@click="toggleMarkGoal(goal)" />
						</template>
					</draggable>
					<template v-else>
						<HabbitItem
							v-for="goal in dailyGoalsColored"
							:key="goal.id"
							:data="{
								...getFullGoalData(goal),
								severity: habbitsStore.getGoalSeverity(goal) === 'empty' ? 'empty' : '',
							}"
							:showCheckBadge="habbitsStore.getGoalSeverity(goal) !== 'empty'"
							:showTooltip="!editMode"
							@click="onReachGoal(goal)" />
					</template>
					<HabbitItem
						v-if="editMode"
						@click="openaddDailyGoalDialog"
						:showTooltip="!editMode"
						:data="{ severity: 'empty', icon: 'add', name: 'add' }" />
				</div>
				<!-- Pusty stan celów -->
				<div v-if="dailyGoalsList.length === 0 && !editMode" class="hc-goals-empty">
					<span class="hc-goals-empty-emoji">🎯</span>
					<p class="hc-goals-empty-text">Set goals to track your progress</p>
					<button class="hc-goals-empty-btn" @click="toggleEditMode">
						<i class="pi pi-plus" style="font-size: 0.55rem"></i>
						Add goals
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import HabbitItem from "@/components/home_view/HabbitItem.vue";
import HabbitSearch from "@/components/home_view/HabbitSearch.vue";
import Dialog from "primevue/dialog";
import { ref, computed, onBeforeUnmount, nextTick } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import draggable from "vuedraggable";
import { toDateKey } from "@/utils/timeUtils";

import { Habbit, Goal } from "@/libs/types";

const habbitsStore = useHabbitsStore();
const {
	allHabbitsList,
	selectedDayHabbits,
	dailyGoalsColored,
	dailyGoalsList,
	userHabbitsList,
} = storeToRefs(habbitsStore);

const props = defineProps<{
	isActive: boolean;
}>();

// Greeting based on time of day
const greetingText = computed(() => {
	const hour = new Date().getHours();
	if (hour < 6) return "Good night";
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
});

const greetingEmoji = computed(() => {
	const hour = new Date().getHours();
	if (hour < 6) return "🌙";
	if (hour < 12) return "☀️";
	if (hour < 18) return "🌤️";
	return "🌙";
});

// Streak — count consecutive days (from yesterday backwards) that have at least 1 habit
const streak = computed(() => {
	let count = 0;
	const today = new Date();

	// If today has habits, count today too
	const todayKey = toDateKey(today);
	const todayEntry = userHabbitsList.value.find((e) => e.date === todayKey);
	if (todayEntry && todayEntry.habbits.length > 0) {
		count++;
	}

	// Go backwards from yesterday
	for (let i = 1; i <= 30; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const key = toDateKey(d);
		const entry = userHabbitsList.value.find((e) => e.date === key);
		if (entry && entry.habbits.length > 0) {
			count++;
		} else {
			break;
		}
	}
	return count;
});

// Licznik ukończonych celów i procent postępu
const totalGoals = computed(() => dailyGoalsList.value.length);
const completedGoals = computed(() => {
	return dailyGoalsColored.value.filter((g) => g.severity !== "empty").length;
});
const goalsPercent = computed(() => {
	if (totalGoals.value === 0) return 0;
	return (completedGoals.value / totalGoals.value) * 100;
});
const goalsRingStyle = computed(() => {
	const pct = goalsPercent.value;
	const color = pct >= 100
		? "var(--p-green-500, #22c55e)"
		: "var(--p-orange-400, #fb923c)";
	const track = "color-mix(in srgb, var(--p-gray-200) 60%, transparent)";
	return {
		background: `conic-gradient(${color} ${pct}%, ${track} ${pct}%)`,
	};
});

const showHabbitDialog = ref(false);
const addDialogMode = ref("");
const selectedTaskToDelete = ref<Habbit | null>(null);
const selectedGoalToDelete = ref<Habbit | null>(null);

// Multi-select session tracking — tracks names of habits added while dialog is open
const addedInSession = ref<string[]>([]);

const headerText = computed(() =>
	addDialogMode.value === "habbit"
		? "Add daily habit"
		: "Add goal to complete",
);
const editMode = ref(false);

function openAddHabbitDialog() {
	addDialogMode.value = "habbit";
	addedInSession.value = [];
	showHabbitDialog.value = true;
}

function openaddDailyGoalDialog() {
	addDialogMode.value = "goal";
	addedInSession.value = [];
	showHabbitDialog.value = true;
}

function handleHabbitSelect(habbit: Habbit) {
	if (addDialogMode.value === "habbit") {
		habbitsStore.addHabbitToSelectedDay(habbit);
	} else if (addDialogMode.value === "goal") {
		habbitsStore.addDailyGoal(habbit);
	}

	// Track the added habit — dialog stays open for multi-select
	if (!addedInSession.value.includes(habbit.name)) {
		addedInSession.value.push(habbit.name);
	}
}

function deleteSelectedTask() {
	if (selectedTaskToDelete.value) {
		habbitsStore.deleteHabbitFromSelectedDay(selectedTaskToDelete.value);
	}
}
const onReachGoal = (goal: Goal) => {
	habbitsStore.onGoalClick(goal);
};

function toggleEditMode() {
	editMode.value = !editMode.value;
}

const markedGoalToDelete = ref<string | null>(null);
const goalsContainerRef = ref<Node | null>(null);

function handleClickOutside(event: MouseEvent) {
	if (
		goalsContainerRef.value &&
		!goalsContainerRef.value.contains(event.target as Node)
	) {
		markedGoalToDelete.value = null;
	}
}

function toggleMarkGoal(goal: Goal) {
	if (markedGoalToDelete.value === goal.id) {
		habbitsStore.deleteDailyGoal(goal);
		markedGoalToDelete.value = null; // reset selection
		document.removeEventListener("mousedown", handleClickOutside);
	} else {
		if (goal.id) {
			markedGoalToDelete.value = goal.id;
		}
		// Wait for DOM update to ensure ref is set
		nextTick(() => {
			document.addEventListener("mousedown", handleClickOutside);
		});
	}
}

// Clean up event listener on unmount
onBeforeUnmount(() => {
	document.removeEventListener("mousedown", handleClickOutside);
});

function getGoalDisplayData(goal: Goal) {
	const severity = habbitsStore.getGoalSeverity(goal);

	if (editMode.value && markedGoalToDelete.value === goal.id) {
		return {
			...goal,
			icon: "delete",
			severity: "danger",
		};
	}

	return {
		...goal,
		severity,
	};
}

function getFullGoalData(goal: Goal) {
	if (goal.display_name) return goal;
	const original = allHabbitsList.value.find((h) => h.name === goal.name);
	return original ? { ...original, ...goal } : goal;
}

function handleGlobalClick(event: MouseEvent) {
	const container = goalsContainerRef.value;
	if (
		editMode.value &&
		container &&
		!container.contains(event.target as Node)
	) {
		markedGoalToDelete.value = null;
	}
}
const markedHabbitToDelete = ref<string | null>(null);

function toggleMarkHabbit(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.id) {
		habbitsStore.deleteHabbitFromSelectedDay(habbit);
		markedHabbitToDelete.value = null;
		document.removeEventListener("mousedown", handleHabbitClickOutside);
	} else {
		if (habbit.id) {
			markedHabbitToDelete.value = habbit.id;
		}
		nextTick(() => {
			document.addEventListener("mousedown", handleHabbitClickOutside);
		});
	}
}

function handleHabbitClickOutside(event: MouseEvent) {
	const container = document.querySelector(".tasks-area");
	if (container && !container.contains(event.target as Node)) {
		markedHabbitToDelete.value = null;
		document.removeEventListener("mousedown", handleHabbitClickOutside);
	}
}

onBeforeUnmount(() => {
	document.removeEventListener("mousedown", handleClickOutside);
	document.removeEventListener("mousedown", handleHabbitClickOutside);
});

// This function is used to get the display data for a habbit, including its icon and severity.
// If the habbit is marked for deletion, it will show a delete icon and danger severity
function getHabbitDisplayData(habbit: Habbit) {
	if (markedHabbitToDelete.value === habbit.id) {
		return {
			...habbit,
			icon: "delete",
			severity: "danger",
		};
	}
	return getFullHabbitData(habbit);
}
// This function merges the habbit data with the original data from allHabbitsList to ensure
// that we have the most complete information, especially for display_name and icon.
function getFullHabbitData(habbit: Habbit) {
	// If display_name already exists, return the original
	if (habbit.display_name) return habbit;
	// Search in allHabbitsList by name
	const original = allHabbitsList.value.find((h) => h.name === habbit.name);
	return original ? { ...original, ...habbit } : habbit;
}
</script>
<style scoped>
.card-root[data-active="false"] {
	pointer-events: none;
	user-select: none;
	opacity: 0.7;
}

/* ====== Habit Search Dialog ====== */

/* Float the close button over the hero */
:deep(.hs-dialog .p-dialog-header) {
	position: absolute !important;
	top: 0;
	right: 0;
	left: auto;
	z-index: 10;
	background: transparent !important;
	border: none !important;
	padding: 0.6rem 0.7rem !important;
}

/* Frosted-glass close button */
:deep(.hs-dialog .p-dialog-header-actions .p-button) {
	background: rgba(255, 255, 255, 0.6) !important;
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border-radius: 0.6rem !important;
	width: 2rem !important;
	height: 2rem !important;
	color: var(--p-gray-500) !important;
	border: 1px solid rgba(255, 255, 255, 0.3) !important;
	transition: all 0.2s ease !important;
}
:deep(.hs-dialog .p-dialog-header-actions .p-button:hover) {
	background: rgba(255, 255, 255, 0.85) !important;
	color: var(--p-gray-700) !important;
	transform: scale(1.06);
}
:where(.my-app-dark, .my-app-dark *) :deep(.hs-dialog .p-dialog-header-actions .p-button) {
	background: rgba(0, 0, 0, 0.35) !important;
	border-color: rgba(255, 255, 255, 0.08) !important;
	color: var(--p-gray-400) !important;
}
:where(.my-app-dark, .my-app-dark *) :deep(.hs-dialog .p-dialog-header-actions .p-button:hover) {
	background: rgba(0, 0, 0, 0.55) !important;
	color: var(--p-gray-200) !important;
}

/* Remove default dialog content padding */
:deep(.hs-dialog .p-dialog-content) {
	padding: 0 !important;
}

/* Warm rounded dialog */
:deep(.hs-dialog.p-dialog) {
	border-radius: 1.25rem !important;
	overflow: hidden;
}

/* Dialog hero header */
.hs-dialog-hero {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2rem 1.5rem 1.1rem;
	overflow: hidden;
	text-align: center;
}
.hs-dialog-hero-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--p-orange-100) 50%, transparent) 0%,
		transparent 100%
	);
	z-index: 0;
}
:where(.my-app-dark, .my-app-dark *) .hs-dialog-hero-bg {
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--p-orange-900) 20%, transparent) 0%,
		transparent 100%
	);
}
.hs-dialog-hero > *:not(.hs-dialog-hero-bg) {
	position: relative;
	z-index: 1;
}
.hs-dialog-emoji {
	font-size: 2rem;
	line-height: 1;
	margin-bottom: 0.45rem;
}
.hs-dialog-title {
	font-family: 'Lora', serif;
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--p-gray-800);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .hs-dialog-title {
	color: var(--p-gray-100);
}
.hs-dialog-subtitle {
	font-size: 0.8rem;
	color: var(--p-gray-400);
	margin-top: 0.2rem;
}
:where(.my-app-dark, .my-app-dark *) .hs-dialog-subtitle {
	color: var(--p-gray-500);
}

/* Dialog body */
.hs-dialog-body {
	padding: 0.75rem 1.25rem 1.35rem;
	max-height: 55vh;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--p-orange-200) transparent;
}
:where(.my-app-dark, .my-app-dark *) .hs-dialog-body {
	scrollbar-color: var(--p-gray-600) transparent;
}

/* Dialog footer — sticky done button */
.hs-dialog-footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
	padding: 0.85rem 1.25rem;
	border-top: 1px solid var(--p-orange-100);
	background: color-mix(in srgb, var(--p-orange-50) 50%, white);
}
:where(.my-app-dark, .my-app-dark *) .hs-dialog-footer {
	border-top-color: var(--p-gray-700);
	background: color-mix(in srgb, var(--p-gray-800) 80%, transparent);
}

.hs-added-badge {
	font-size: 0.72rem;
	font-weight: 600;
	color: var(--p-green-600);
	background: color-mix(in srgb, var(--p-green-100) 60%, transparent);
	padding: 0.25rem 0.65rem;
	border-radius: 9999px;
	user-select: none;
}
:where(.my-app-dark, .my-app-dark *) .hs-added-badge {
	color: var(--p-green-400);
	background: color-mix(in srgb, var(--p-green-900) 30%, transparent);
}

.hs-done-btn {
	padding: 0.45rem 1.5rem;
	border-radius: 0.65rem;
	border: none;
	background: var(--p-orange-500);
	color: white;
	font-family: 'Lora', serif;
	font-size: 0.82rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}
.hs-done-btn:hover {
	background: var(--p-orange-600);
	transform: translateY(-1px);
	box-shadow: 0 3px 10px color-mix(in srgb, var(--p-orange-500) 30%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hs-done-btn {
	background: var(--p-orange-600);
}
:where(.my-app-dark, .my-app-dark *) .hs-done-btn:hover {
	background: var(--p-orange-500);
}

/* Badge transition */
.hs-badge-enter-active {
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hs-badge-leave-active {
	transition: all 0.2s ease;
}
.hs-badge-enter-from {
	opacity: 0;
	transform: scale(0.7);
}
.hs-badge-leave-to {
	opacity: 0;
	transform: scale(0.8);
}

/* ====== Greeting Area ====== */
.hc-greeting-area {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}
.hc-greeting-hello {
	font-size: 1.25rem;
	line-height: 1;
	margin-right: 0.3rem;
	vertical-align: middle;
}
.hc-greeting-text {
	font-family: 'Lora', serif;
	font-size: 1.05rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
	display: inline;
	vertical-align: middle;
}
:where(.my-app-dark, .my-app-dark *) .hc-greeting-text {
	color: var(--p-gray-200);
}

/* Streak badge */
.hc-streak {
	display: flex;
	align-items: center;
	gap: 0.2rem;
	padding: 0.25rem 0.6rem;
	border-radius: 9999px;
	background: color-mix(in srgb, var(--p-orange-100) 60%, transparent);
	cursor: default;
	user-select: none;
	transition: transform 0.2s ease;
}
.hc-streak:hover {
	transform: scale(1.06);
}
:where(.my-app-dark, .my-app-dark *) .hc-streak {
	background: color-mix(in srgb, var(--p-orange-900) 30%, transparent);
}
.hc-streak-fire {
	font-size: 0.9rem;
	line-height: 1;
}
.hc-streak-num {
	font-family: 'Lora', serif;
	font-size: 0.85rem;
	font-weight: 700;
	color: var(--p-orange-600);
	line-height: 1;
}
:where(.my-app-dark, .my-app-dark *) .hc-streak-num {
	color: var(--p-orange-400);
}

/* ====== Habits Counter ====== */
.hc-header {
	text-align: center;
	padding: 0.25rem 0;
}
.hc-count {
	font-family: 'Lora', serif;
	font-size: 1.6rem;
	font-weight: 700;
	color: var(--p-orange-500);
	line-height: 1;
}
:where(.my-app-dark, .my-app-dark *) .hc-count {
	color: var(--p-orange-400);
}
.hc-count-label {
	font-family: 'Lora', serif;
	font-size: 0.82rem;
	font-weight: 500;
	color: var(--p-gray-500);
	margin-left: 0.35rem;
}
:where(.my-app-dark, .my-app-dark *) .hc-count-label {
	color: var(--p-gray-400);
}
.hc-encourage {
	font-family: 'Lora', serif;
	font-size: 0.85rem;
	color: var(--p-gray-400);
	font-style: italic;
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .hc-encourage {
	color: var(--p-gray-500);
}
.hc-plus-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 0.35rem;
	border: 1.5px dashed var(--p-orange-300);
	color: var(--p-orange-400);
	font-size: 0.75rem;
	font-weight: 600;
	font-style: normal;
	vertical-align: middle;
	margin: 0 0.15rem;
}

/* ====== Goals Section ====== */
.hc-goals-section {
	margin-top: 1.25rem;
	padding: 0.75rem 0.85rem;
	border-radius: 0.85rem;
	background: color-mix(in srgb, var(--p-orange-50) 40%, transparent);
	border: 1px solid color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-section {
	background: color-mix(in srgb, var(--p-gray-700) 30%, transparent);
	border-color: color-mix(in srgb, var(--p-gray-600) 30%, transparent);
}
.hc-goals-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.hc-goals-header-left {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

/* ====== Goals Progress Ring ====== */
.hc-goals-ring {
	width: 2rem;
	height: 2rem;
	border-radius: 9999px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.4s ease;
}
.hc-goals-ring-inner {
	width: 1.45rem;
	height: 1.45rem;
	border-radius: 9999px;
	background: color-mix(in srgb, var(--p-orange-50) 40%, white);
	display: flex;
	align-items: center;
	justify-content: center;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-ring-inner {
	background: color-mix(in srgb, var(--p-gray-700) 80%, var(--p-gray-800));
}
.hc-goals-ring-text {
	font-family: 'Lora', serif;
	font-size: 0.48rem;
	font-weight: 700;
	color: var(--p-gray-600);
	line-height: 1;
	letter-spacing: -0.02em;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-ring-text {
	color: var(--p-gray-300);
}

.hc-goals-title {
	font-family: 'Lora', serif;
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-title {
	color: var(--p-gray-200);
}
.hc-edit-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.25rem 0.65rem;
	border-radius: 9999px;
	border: 1px solid var(--p-orange-200);
	background: white;
	color: var(--p-gray-500);
	font-family: 'Lora', serif;
	font-size: 0.7rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	user-select: none;
}
.hc-edit-pill:hover {
	border-color: var(--p-orange-300);
	color: var(--p-orange-600);
	background: var(--p-orange-50);
}
.hc-edit-pill.active {
	background: var(--p-green-50);
	border-color: var(--p-green-300);
	color: var(--p-green-600);
}
.hc-edit-pill.active:hover {
	background: var(--p-green-100);
}
:where(.my-app-dark, .my-app-dark *) .hc-edit-pill {
	border-color: var(--p-gray-600);
	background: transparent;
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .hc-edit-pill:hover {
	border-color: var(--p-gray-500);
	color: var(--p-gray-200);
}
:where(.my-app-dark, .my-app-dark *) .hc-edit-pill.active {
	background: color-mix(in srgb, var(--p-green-900) 30%, transparent);
	border-color: var(--p-green-700);
	color: var(--p-green-400);
}

/* ====== Goals Empty State ====== */
.hc-goals-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.6rem 0.5rem;
	text-align: center;
}
.hc-goals-empty-emoji {
	font-size: 1.15rem;
	margin-bottom: 0.2rem;
	opacity: 0.5;
}
.hc-goals-empty-text {
	font-family: 'Lora', serif;
	font-size: 0.72rem;
	color: var(--p-gray-400);
	margin: 0 0 0.35rem 0;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-empty-text {
	color: var(--p-gray-500);
}
.hc-goals-empty-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.3rem 0.75rem;
	border-radius: 0.5rem;
	border: 1px dashed var(--p-orange-300);
	background: transparent;
	color: var(--p-orange-500);
	font-family: 'Lora', serif;
	font-size: 0.72rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}
.hc-goals-empty-btn:hover {
	background: var(--p-orange-50);
	border-style: solid;
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-empty-btn {
	border-color: var(--p-gray-500);
	color: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .hc-goals-empty-btn:hover {
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
}
</style>
