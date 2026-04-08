<template>
	<Dialog
		v-model:visible="showHabbitDialog"
		modal
		dismissableMask
		:closable="true"
		:show-header="false"
		class="hs-dialog w-[clamp(22rem,85vw,42rem)] pt-">
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
			<HabbitSearch @select="handleHabbitSelect" />
		</div>
	</Dialog>
	<div
		class="card-root"
		:data-active="isActive">
		<div
			class="flex flex-col card-a sm:w-[480px] surface-content w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto"
			@click.capture="handleGlobalClick">
			<div class="text-center">
				<h3 class="text-c font-lora italic">You're doing great! ✨</h3>
			</div>
			<div class="tasks-area mt-8 h-2/3">
				<div class="flex flex-row flex-wrap h-min gap-2">
					<draggable
						v-model="selectedDayHabbits"
						item-key="id"
						class="flex flex-row flex-wrap h-min gap-2"
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

			<Divider></Divider>
			<div class="flex flex-col gap-6 flex-grow">
				<div class="text-center">
					<h3 class="font-lora">Daily goals 🎯</h3>
				</div>
				<div
					class="text-right cursor-pointer"
					@click="toggleEditMode">
					<h4
						class="inline-block border-b text-border-success-hover-danger transition-colors">
						{{ editMode ? "Close edit mode" : "Edit goals" }}
					</h4>
				</div>
				<div
					ref="goalsContainerRef"
					class="flex flex-row flex-wrap h-min gap-2">
					<draggable
						v-if="editMode"
						v-model="dailyGoalsList"
						item-key="id"
						class="flex flex-row flex-wrap gap-2"
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
								severity: habbitsStore.getGoalSeverity(goal),
							}"
							:showTooltip="!editMode"
							@click="onReachGoal(goal)" />
					</template>
					<HabbitItem
						v-if="editMode"
						@click="openaddDailyGoalDialog"
						:data="{ severity: 'empty', icon: 'add', name: 'add' }" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import HabbitItem from "@/components/home_view/HabbitItem.vue";
import HabbitSearch from "@/components/home_view/HabbitSearch.vue";
import Divider from "primevue/divider";

import Dialog from "primevue/dialog";
import { ref, computed, onBeforeUnmount, nextTick } from "vue";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import draggable from "vuedraggable";

import { Habbit, Goal } from "@/libs/types";

const habbitsStore = useHabbitsStore();
const {
	allHabbitsList,
	selectedDayHabbits,
	dailyGoalsColored,
	dailyGoalsList,
} = storeToRefs(habbitsStore);

const props = defineProps<{
	isActive: boolean;
}>();

const showHabbitDialog = ref(false);
const addDialogMode = ref("");
const selectedTaskToDelete = ref<Habbit | null>(null);
const selectedGoalToDelete = ref<Habbit | null>(null);

const headerText = computed(() =>
	addDialogMode.value === "habbit"
		? "Add daily habit"
		: "Add goal to complete",
);
const editMode = ref(false);

function openAddHabbitDialog() {
	addDialogMode.value = "habbit";
	showHabbitDialog.value = true;
}

function openaddDailyGoalDialog() {
	addDialogMode.value = "goal";
	showHabbitDialog.value = true;
}

function handleHabbitSelect(habbit: Habbit) {
	if (addDialogMode.value === "habbit") {
		habbitsStore.addHabbitToSelectedDay(habbit);
	} else if (addDialogMode.value === "goal") {
		habbitsStore.addDailyGoal(habbit);
	}

	showHabbitDialog.value = false;
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
</style>
