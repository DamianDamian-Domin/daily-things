<template>
	<section
		class="today dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="today-title">
		<!-- ============ NAGŁÓWEK ============ -->
		<header class="today-head">
			<div class="today-greeting">
				<h2
					id="today-title"
					class="today-title">
					<span aria-hidden="true">{{ dayPart.emoji }}</span>
					{{ headline }}
				</h2>
				<p class="today-sub">{{ subline }}</p>
			</div>
			<div class="today-head-actions">
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="When did I last…? Search your history"
					v-tooltip.bottom="'When did I last…?'"
					@click="insights.open('lastDone')">
					<i
						class="pi pi-history"
						aria-hidden="true"></i>
				</button>
				<div
					v-if="habitsStore.streak > 0"
					class="streak-chip"
					:class="{ 'at-risk': habitsStore.streakAtRisk }"
					role="img"
					:aria-label="`${habitsStore.streak}-day streak`"
					v-tooltip.bottom="streakTooltip">
					<PixelIcon
						icon="local_fire_department"
						:palette="habitsStore.streakAtRisk ? 'gray' : 'orange'"
						:size="22" />
					<span>{{ habitsStore.streak }}</span>
				</div>
			</div>
		</header>

		<div class="today-scroll">
			<!-- ============ CELE ============ -->
			<section
				class="dt-panel goals"
				:class="{ 'is-complete': progress.complete }"
				aria-labelledby="goals-title">
				<div class="panel-head">
					<div
						v-if="progress.total > 0"
						class="dt-ring"
						:class="{ 'is-complete': progress.complete }"
						:style="{ '--pct': ringPct }"
						aria-hidden="true">
						<span>{{ progress.done }}/{{ progress.total }}</span>
					</div>
					<div class="panel-title-wrap">
						<h3
							id="goals-title"
							class="dt-section-title">
							Daily goals
						</h3>
						<p
							v-if="progress.total > 0 || isRestDay"
							class="panel-hint">
							{{ goalsHint }}
						</p>
					</div>
					<div class="panel-actions">
						<button
							v-if="hasGoals"
							type="button"
							class="dt-icon-btn"
							aria-label="Weekly routine: choose days for each goal"
							v-tooltip.bottom="'Weekly routine'"
							@click="scheduleOpen = true">
							<i
								class="pi pi-calendar"
								aria-hidden="true"></i>
						</button>
						<button
							v-if="hasGoals"
							type="button"
							class="dt-icon-btn reminders-btn"
							:class="{ 'is-on': remindersOn > 0 }"
							:aria-label="remindersLabel"
							v-tooltip.bottom="remindersLabel"
							@click="remindersOpen = true">
							<i
								class="pi pi-bell"
								aria-hidden="true"></i>
							<span
								v-if="remindersOn > 0"
								class="reminders-dot"
								aria-hidden="true"></span>
						</button>
						<button
							type="button"
							class="dt-btn dt-btn-ghost dt-btn-sm"
							@click="openDialog('goal')">
							<i
								class="pi pi-pencil"
								aria-hidden="true"></i>
							<span :class="{ 'edit-label': hasGoals }">{{ hasGoals ? "Edit" : "Set goals" }}</span>
						</button>
					</div>
				</div>

				<Transition name="banner">
					<p
						v-if="progress.complete"
						class="goals-banner"
						role="status">
						🌟 All goals done{{ habitsStore.isSelectedToday ? " for today" : "" }}! Well
						deserved.
					</p>
				</Transition>

				<draggable
					v-if="goalTiles.length > 0"
					v-model="goalTiles"
					item-key="name"
					class="tile-row"
					ghost-class="tile-ghost"
					:animation="160"
					:delay="220"
					:delay-on-touch-only="true"
					:touch-start-threshold="6">
					<template #item="{ element: goal }">
						<HabitTile
							:habit="goal.habit"
							show-label
							:muted="goal.done === 0"
							:done="goal.done >= goal.target"
							:badge="goalBadge(goal)"
							:progress="goal.target > 1 ? goal.done / goal.target : null"
							:aria-label="goalAria(goal)"
							:pressed="goal.done >= goal.target"
							@click="(e: MouseEvent) => onGoalTap(goal, e)" />
					</template>
				</draggable>

				<p
					v-else-if="isRestDay"
					class="rest-day"
					role="status">
					<span aria-hidden="true">🌿</span>
					No goals planned for {{ weekdayLabel }}. Enjoy the day off, your streak is safe.
				</p>

				<div
					v-if="weeklyTiles.length > 0"
					class="weekly"
					:class="{ 'has-daily': goalTiles.length > 0 || isRestDay }">
					<h4 class="weekly-title">
						This week
						<span class="weekly-sub">{{ weeklySummary }}</span>
					</h4>
					<div class="tile-row">
						<HabitTile
							v-for="goal in weeklyTiles"
							:key="goal.name"
							:habit="goal.habit"
							show-label
							:muted="goal.done === 0"
							:done="goal.done >= goal.target"
							:badge="goal.done >= goal.target ? '✓' : `${goal.done}/${goal.target}`"
							:progress="goal.done / goal.target"
							:selected="stepperFor === goal.name"
							:aria-label="weeklyAria(goal)"
							:pressed="goal.doneOnDay > 0"
							@click="(e: MouseEvent) => onWeeklyTap(goal, e)" />
					</div>
				</div>

				<div
					v-if="!hasGoals"
					class="goals-empty">
					<PixelIcon
						icon="flag"
						palette="yellow"
						:size="34" />
					<p>
						Pick 2–3 small things you'd like to do every day. Tapping a goal logs it — that's it.
					</p>
					<StarterPacks
						v-if="habitsStore.isSelectedToday"
						title="Not sure where to start?"
						compact
						:limit="4" />
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						@click="openDialog('goal')">
						{{ habitsStore.isSelectedToday ? "Or choose your own" : "Choose goals" }}
					</button>
				</div>
			</section>

			<!-- ============ ZALOGOWANE ============ -->
			<section
				class="logged"
				aria-labelledby="logged-title">
				<div class="panel-head">
					<h3
						id="logged-title"
						class="dt-section-title">
						{{ loggedHeading }}
					</h3>
					<span
						v-if="otherLogsCount"
						class="logged-count"
						:class="{ bump: countBump }"
						>{{ otherLogsCount }}</span
					>
				</div>

				<div class="tile-row">
					<draggable
						v-model="loggedTiles"
						item-key="name"
						class="contents"
						ghost-class="tile-ghost"
						:animation="160"
						:delay="220"
						:delay-on-touch-only="true"
						:touch-start-threshold="6">
						<template #item="{ element: group }">
							<HabitTile
								:habit="group.habit"
								show-label
								:badge="group.count > 1 ? `×${group.count}` : null"
								:selected="stepperFor === group.name"
								:aria-label="`${group.habit.display_name}, logged ${group.count} ${group.count === 1 ? 'time' : 'times'}. Edit`"
								aria-haspopup="dialog"
								@click="(e: MouseEvent) => openStepper(group.name, e)" />
						</template>
					</draggable>

					<button
						type="button"
						class="add-tile"
						aria-label="Log a habit"
						v-tooltip.bottom="'Log a habit'"
						@click="openDialog('log')">
						<i
							class="pi pi-plus"
							aria-hidden="true"></i>
					</button>
				</div>

				<p
					v-if="loggedTiles.length === 0"
					class="logged-empty">
					{{ loggedEmptyText }}
				</p>
			</section>

			<!-- ============ NASTRÓJ ============ -->
			<MoodPicker class="dt-panel" />
		</div>

		<!-- Stepper −/+ dla zalogowanego habitu -->
		<Popover
			ref="stepperRef"
			:pt="{ root: { class: 'stepper-pop' } }"
			@hide="stepperFor = null">
			<div
				v-if="stepperGroup"
				class="stepper"
				role="dialog"
				:aria-label="`Edit ${stepperGroup.habit.display_name}`">
				<p class="stepper-name">{{ stepperGroup.habit.display_name }}</p>
				<div class="stepper-row">
					<button
						type="button"
						class="stepper-btn"
						aria-label="Remove one"
						@click="stepDown">
						<i
							class="pi pi-minus"
							aria-hidden="true"></i>
					</button>
					<span
						class="stepper-count"
						aria-live="polite"
						>×{{ stepperGroup.count }}</span
					>
					<button
						type="button"
						class="stepper-btn is-plus"
						aria-label="Log one more"
						@click="stepUp">
						<i
							class="pi pi-plus"
							aria-hidden="true"></i>
					</button>
				</div>
				<ul
					v-if="stepperNotes.length"
					class="stepper-notes"
					aria-label="Notes">
					<li
						v-for="n in stepperNotes"
						:key="n.id">
						<i
							class="pi pi-pencil"
							aria-hidden="true"></i>
						{{ n.note }}
					</li>
				</ul>
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="editNote">
					<i
						class="pi pi-pen-to-square"
						aria-hidden="true"></i>
					{{ stepperLast?.note ? "Edit note" : "Add note" }}
				</button>
				<button
					v-if="stepperGroup.count > 1"
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm stepper-clear"
					@click="removeAll">
					Remove all
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="openHistory">
					<i
						class="pi pi-history"
						aria-hidden="true"></i>
					History
				</button>
			</div>
		</Popover>

		<AddHabitDialog
			v-model="dialogOpen"
			:mode="dialogMode"
			@logged="markTap" />
		<RemindersDialog
			v-if="remindersNeeded"
			v-model="remindersOpen" />
		<GoalScheduleDialog
			v-if="scheduleNeeded"
			v-model="scheduleOpen" />
	</section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import Popover from "primevue/popover";
import draggable from "vuedraggable";
import type { GroupedGoal, GroupedHabit, WeeklyGoal } from "@/libs/types";
import { useHabitsStore } from "@/stores/habits";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useRemindersStore } from "@/stores/reminders";
import { useInsightsStore } from "@/stores/insights";
import { useLogNoteStore } from "@/stores/logNote";
import { useSound } from "@/utils/useSound";
import { useConfetti } from "@/utils/useConfetti";
import { randomCheer } from "@/utils/useCompliment";
import { formatDayTitle, partOfDay } from "@/utils/date";
import { displayName } from "@/utils/habitCatalog";
import HabitTile from "@/components/home_view/HabitTile.vue";
const AddHabitDialog = defineAsyncComponent(
	() => import("@/components/home_view/AddHabitDialog.vue"),
);
const RemindersDialog = defineAsyncComponent(
	() => import("@/components/home_view/RemindersDialog.vue"),
);
const GoalScheduleDialog = defineAsyncComponent(
	() => import("@/components/home_view/GoalScheduleDialog.vue"),
);
import PixelIcon from "@/components/ui/PixelIcon.vue";
import StarterPacks from "@/components/home_view/StarterPacks.vue";
import MoodPicker from "@/components/home_view/MoodPicker.vue";

defineProps<{ isActive: boolean }>();

const habitsStore = useHabitsStore();
const authStore = useAuthStore();
const toast = useToastStore();
const preferences = usePreferencesStore();
const remindersStore = useRemindersStore();
const insights = useInsightsStore();
const logNote = useLogNoteStore();
const { playHabitCheck, playUncheck, playVictory } = useSound();
const { launch: launchConfetti } = useConfetti();

// ==========================================================================
// NAGŁÓWEK
// ==========================================================================
const dayPart = computed(() => partOfDay());

const headline = computed(() => {
	if (!habitsStore.isSelectedToday) return formatDayTitle(habitsStore.selectedDate).weekday;
	const name = authStore.firstName;
	return name ? `${dayPart.value.greeting}, ${name}` : dayPart.value.greeting;
});

const progress = computed(() => habitsStore.goalsProgress);
const ringPct = computed(() =>
	progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 0,
);

const subline = computed(() => {
	if (!habitsStore.isSelectedToday) return "Looking back — you can still fill in this day.";
	if (habitsStore.isSelectedRestDay && habitsStore.selectedLogs.length === 0)
		return "A rest day from your routine. Recharge 🌿";
	if (habitsStore.streakAtRisk)
		return `Log anything today to keep your ${habitsStore.streak}-day streak 🔥`;
	const { done, total, complete } = progress.value;
	if (complete) return "Everything's done. Enjoy the rest of your day ☕";
	if (total > 0 && done === 0) return "A fresh day. Start with the easiest goal.";
	if (total > 0) return `${total - done} to go — you've got this.`;
	if (habitsStore.selectedLogs.length > 0) return "Nice rhythm today. Keep it gentle.";
	return "Small steps count. What's one thing you'll do today?";
});

const streakTooltip = computed(() =>
	habitsStore.streakAtRisk
		? `${habitsStore.streak}-day streak — log something today to keep it`
		: `${habitsStore.streak}-day streak — keep it going!`,
);

const goalsHint = computed(() => {
	if (isRestDay.value) return "Rest day";
	const left = progress.value.total - progress.value.done;
	if (progress.value.complete) return "Perfect day ✨";
	return `${left} left · tap a goal to log it`;
});

// ==========================================================================
// CELE
// ==========================================================================
const goalTiles = computed<GroupedGoal[]>({
	get: () => habitsStore.groupedGoals,
	set: (list) => habitsStore.reorderGoals(list.map((g) => g.name)),
});

const hasGoals = computed(() => habitsStore.dailyGoalsList.length > 0);
const isRestDay = computed(() => habitsStore.isSelectedRestDay);
const weekdayLabel = computed(() => formatDayTitle(habitsStore.selectedDate).weekday);

// ==========================================================================
// CELE TYGODNIOWE („3× w tygodniu”)
// ==========================================================================
const weeklyTiles = computed(() => habitsStore.weeklyGoals);
const weeklySummary = computed(() => {
	const hit = weeklyTiles.value.filter((g) => g.done >= g.target).length;
	return hit === weeklyTiles.value.length
		? "all done ✨"
		: `${hit} of ${weeklyTiles.value.length} done`;
});

function weeklyAria(goal: WeeklyGoal) {
	return `${displayName(goal.habit)}: ${goal.done} of ${goal.target} this week`;
}

// Jeszcze nie odhaczone tego dnia → +1. Już odhaczone → stepper −/+.
function onWeeklyTap(goal: WeeklyGoal, event: MouseEvent) {
	markTap();
	if (goal.doneOnDay > 0) {
		openStepper(goal.name, event);
		return;
	}
	playHabitCheck();
	if (!habitsStore.logHabit(goal.habit)) return;
	const done = goal.done + 1;
	toast.undoable(
		`${displayName(goal.habit)} (${Math.min(done, goal.target)}/${goal.target} this week) — ${randomCheer()}`,
		() => habitsStore.unlogHabit(goal.name),
	);
	if (done === goal.target) flyEmoji();
}

function goalBadge(goal: GroupedGoal) {
	if (goal.done >= goal.target) return "✓";
	if (goal.target > 1) return `${goal.done}/${goal.target}`;
	return null;
}

function goalAria(goal: GroupedGoal) {
	const name = displayName(goal.habit);
	if (goal.target > 1) return `${name}: ${goal.done} of ${goal.target} done`;
	return `${name}: ${goal.done ? "done" : "not done yet"}`;
}

// Stuknięcie w cel: dopóki nie jest zrobiony → +1. Zrobiony → stepper −/+,
// żeby przypadkowe stuknięcie niczego nie odznaczało.
async function onGoalTap(goal: GroupedGoal, event: MouseEvent) {
	markTap();
	if (goal.done >= goal.target) {
		openStepper(goal.name, event);
		return;
	}
	playHabitCheck();
	const result = habitsStore.tapGoal(goal);
	if (result === "logged") {
		const done = goal.done + 1;
		const suffix = goal.target > 1 ? ` (${Math.min(done, goal.target)}/${goal.target})` : "";
		const key = habitsStore.selectedKey;
		const log = habitsStore.lastLog(goal.name, key);
		toast.undoable(
			`${displayName(goal.habit)}${suffix} — ${randomCheer()}`,
			() => habitsStore.unlogHabit(goal.name),
			log ? logNote.toastAction(log.id, key) : undefined,
		);
		if (done >= goal.target) flyEmoji();
	}
}

// Świętujemy tylko po akcji użytkownika — nie wtedy, gdy dane się wczytały
let lastTapAt = 0;
const markTap = () => (lastTapAt = Date.now());

// Świętowanie, gdy wszystkie cele zrobione
watch(
	() => progress.value.complete,
	(complete, was) => {
		const byUser = Date.now() - lastTapAt < 2000;
		if (complete && was === false && byUser && habitsStore.isSelectedToday) {
			playVictory();
			launchConfetti();
			toast.show("All goals done — what a day! 🌟", { tone: "celebrate", duration: 3500 });
		}
	},
);

function flyEmoji() {
	if (!preferences.animationsEnabled) return;
	const emojis = ["✨", "⭐", "🌟", "💫", "🎯"];
	const el = document.createElement("span");
	el.className = "fly-emoji";
	el.setAttribute("aria-hidden", "true");
	el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
	el.style.left = `${40 + Math.random() * 20}vw`;
	el.style.bottom = `${140 + Math.random() * 60}px`;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 900);
}

// ==========================================================================
// ZALOGOWANE HABITY + STEPPER
// ==========================================================================
// Habity-cele mają już swoje kafelki wyżej — tu pokazujemy resztę dnia
const goalNames = computed(
	() =>
		new Set([
			...habitsStore.groupedGoals.map((g) => g.name),
			...habitsStore.weeklyGoals.map((g) => g.name),
		]),
);
const loggedTiles = computed<GroupedHabit[]>({
	get: () => habitsStore.groupedSelectedDayHabits.filter((g) => !goalNames.value.has(g.name)),
	set: (list) =>
		habitsStore.reorderSelected([
			...habitsStore.groupedSelectedDayHabits
				.filter((g) => goalNames.value.has(g.name))
				.map((g) => g.name),
			...list.map((g) => g.name),
		]),
});
const otherLogsCount = computed(() => loggedTiles.value.reduce((sum, g) => sum + g.count, 0));

const loggedHeading = computed(() => {
	if (goalNames.value.size > 0) return "Also logged";
	return habitsStore.isSelectedToday ? "Logged today" : "Logged that day";
});
const loggedEmptyText = computed(() => {
	if (goalNames.value.size > 0) return "Did something else nice? Tap + to add it.";
	return habitsStore.isSelectedToday
		? "Nothing logged yet. Tap + and add the first little win of your day 🌱"
		: "Nothing was logged that day. You can still add it now.";
});

const countBump = ref(false);
watch(
	() => otherLogsCount.value,
	(next, prev) => {
		if (next > (prev ?? 0)) {
			countBump.value = true;
			setTimeout(() => (countBump.value = false), 400);
		}
	},
);

const stepperRef = ref<InstanceType<typeof Popover> | null>(null);
const stepperFor = ref<string | null>(null);
const stepperGroup = computed(() =>
	habitsStore.groupedSelectedDayHabits.find((g) => g.name === stepperFor.value),
);

function openStepper(name: string, event: MouseEvent) {
	if (stepperFor.value === name) {
		stepperRef.value?.hide();
		return;
	}
	stepperFor.value = name;
	stepperRef.value?.show(event, event.currentTarget as HTMLElement);
}

async function stepUp() {
	const group = stepperGroup.value;
	if (!group) return;
	markTap();
	playHabitCheck();
	habitsStore.logHabit(group.habit);
}

async function stepDown() {
	const group = stepperGroup.value;
	if (!group) return;
	playUncheck();
	const name = group.name;
	const removed = habitsStore.unlogHabit(name);
	if (!removed) return;
	if (!stepperGroup.value) stepperRef.value?.hide();
	toast.undoable(`Removed ${displayName(group.habit)}`, () =>
		habitsStore.restoreLogs([removed]),
	);
}

async function removeAll() {
	const group = stepperGroup.value;
	if (!group) return;
	stepperRef.value?.hide();
	playUncheck();
	const removed = habitsStore.removeAllLogs(group.name);
	if (removed.length)
		toast.undoable(`Removed ${displayName(group.habit)} ×${removed.length}`, () =>
			habitsStore.restoreLogs(removed),
		);
}

// Notatki przy odhaczeniach tego habitu w wybranym dniu; przycisk edytuje
// najnowsze odhaczenie
const stepperLast = computed(() =>
	stepperFor.value ? habitsStore.lastLog(stepperFor.value) : undefined,
);
const stepperNotes = computed(() =>
	habitsStore.selectedLogs.filter((l) => l.name === stepperFor.value && l.note),
);

function editNote() {
	const log = stepperLast.value;
	if (!log) return;
	stepperRef.value?.hide();
	logNote.open(log.id, habitsStore.selectedKey);
}

// „Kiedy ostatnio” z rozwiniętą historią tego habitu
function openHistory() {
	const group = stepperGroup.value;
	if (!group) return;
	stepperRef.value?.hide();
	insights.open("lastDone", { habit: group.name });
}

// Zmiana dnia zamyka stepper
watch(
	() => habitsStore.selectedKey,
	() => stepperRef.value?.hide(),
);

// ==========================================================================
// DIALOG DODAWANIA
// ==========================================================================
const dialogOpen = ref(false);
const dialogMode = ref<"log" | "goal">("log");

function openDialog(mode: "log" | "goal") {
	markTap();
	dialogMode.value = mode;
	dialogOpen.value = true;
}

// ==========================================================================
// PRZYPOMNIENIA (okno ładowane dopiero po pierwszym otwarciu)
// ==========================================================================
const remindersOpen = ref(false);
const remindersNeeded = ref(false);
watch(remindersOpen, (open) => {
	if (open) remindersNeeded.value = true;
});
const scheduleOpen = ref(false);
const scheduleNeeded = ref(false);
watch(scheduleOpen, (open) => {
	if (open) scheduleNeeded.value = true;
});
const remindersOn = computed(() => remindersStore.activeReminders.length);
const remindersLabel = computed(() =>
	remindersOn.value > 0
		? `Reminders: ${remindersOn.value} on`
		: "Set reminders",
);
</script>

<style scoped>
.today {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}
@media (min-width: 641px) {
	.today {
		width: 30rem;
	}
}
.today.is-inactive {
	pointer-events: none;
	user-select: none;
}

.today-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}
.today-greeting {
	min-width: 0;
}
.today-head-actions {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	flex-shrink: 0;
}
.today-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
	line-height: 1.25;
}
.today-sub {
	margin: 0.2rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
	line-height: 1.4;
}

.streak-chip {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	padding: 0.2rem 0.7rem 0.2rem 0.4rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-weight: 700;
	font-size: var(--dt-text-md);
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}
.streak-chip.at-risk {
	background: var(--dt-surface-sunken);
	color: var(--dt-text-2);
	animation: streak-nudge 2.4s ease-in-out infinite;
}
@keyframes streak-nudge {
	0%,
	85%,
	100% {
		transform: rotate(0);
	}
	90% {
		transform: rotate(-6deg);
	}
	95% {
		transform: rotate(6deg);
	}
}

.today-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin: 0 -0.35rem;
	padding: 0.35rem 0.35rem 0.5rem;
	overscroll-behavior: contain;
}

.panel-head {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	margin-bottom: 0.75rem;
}
.panel-title-wrap {
	flex: 1;
	min-width: 0;
}
.panel-actions {
	display: flex;
	align-items: center;
	gap: 0.15rem;
	flex-shrink: 0;
}
/* Na wąskim ekranie „Edit” zostaje samą ikoną — tytuł celów potrzebuje miejsca */
@media (max-width: 480px) {
	.edit-label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
}
.panel-hint {
	margin: 0.1rem 0 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}

.goals {
	transition:
		background-color 0.4s ease,
		border-color 0.4s ease;
}
.goals.is-complete {
	background: color-mix(in srgb, var(--dt-success-soft) 70%, var(--dt-surface-soft));
	border-color: color-mix(in srgb, var(--dt-success-fill) 35%, transparent);
}
.goals-banner {
	margin: -0.25rem 0 0.75rem;
	padding: 0.5rem 0.85rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface);
	color: var(--dt-success);
	font-size: var(--dt-text-sm);
	font-weight: 700;
	text-align: center;
	box-shadow: var(--dt-shadow-sm);
}
.rest-day {
	margin: 0;
	padding: 0.7rem 0.9rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface);
	color: var(--dt-text-2);
	font-size: var(--dt-text-sm);
	line-height: 1.45;
	text-align: center;
}
.weekly.has-daily {
	margin-top: 0.85rem;
	padding-top: 0.75rem;
	border-top: 1px dashed var(--dt-border);
}
.weekly-title {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	margin: 0 0 0.55rem;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text-2);
}
.weekly-sub {
	font-weight: 400;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.goals-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	text-align: center;
	padding: 0.25rem 0.5rem 0.35rem;
}
.goals-empty :deep(.packs) {
	margin: 0.25rem 0;
	text-align: left;
}
.goals-empty p {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.5;
	max-width: 22rem;
}

.tile-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem 0.35rem;
}
/* Podpisy pod kafelkami — nieco węższe, żeby na telefonie zmieściły się 4 w rzędzie */
.tile-row :deep(.tile.has-label) {
	width: 4.25rem;
}
.contents {
	display: contents;
}
.tile-ghost {
	opacity: 0.35;
}

.reminders-btn {
	position: relative;
	flex-shrink: 0;
}
.reminders-btn.is-on {
	color: var(--dt-accent-ink);
}
.reminders-dot {
	position: absolute;
	top: 0.45rem;
	right: 0.5rem;
	width: 0.45rem;
	height: 0.45rem;
	border-radius: 50%;
	background: var(--dt-accent);
	box-shadow: 0 0 0 2px var(--dt-surface-soft);
}

.logged .panel-head {
	margin-bottom: 0.65rem;
}
.logged-count {
	display: inline-grid;
	place-items: center;
	min-width: 1.6rem;
	height: 1.6rem;
	padding: 0 0.4rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-size: var(--dt-text-sm);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.logged-count.bump {
	animation: bump 0.4s var(--dt-spring);
}
@keyframes bump {
	50% {
		transform: scale(1.35);
	}
}
.logged-empty {
	margin: 0.75rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	line-height: 1.5;
}

.add-tile {
	display: grid;
	place-items: center;
	width: 3.4rem;
	height: 3.4rem;
	border-radius: 1rem;
	border: 2px dashed color-mix(in srgb, var(--dt-accent) 55%, var(--dt-border-strong));
	background: transparent;
	color: var(--dt-accent-ink);
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease,
		box-shadow var(--dt-t) ease,
		transform 0.22s var(--dt-spring);
}
@media (hover: hover) {
	.add-tile:hover {
		background: var(--dt-hover-bg);
		border-color: var(--dt-accent);
		transform: translateY(var(--dt-lift));
		box-shadow: var(--dt-shadow-hover);
	}
}
.add-tile:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 1.4));
}
.add-tile i {
	font-size: 1.1rem;
	font-weight: 700;
}

/* Stepper */
.stepper {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	padding: 0.25rem;
	min-width: 10rem;
}
.stepper-name {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text);
	text-align: center;
}
.stepper-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}
.stepper-btn {
	display: grid;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 50%;
	border: 1px solid var(--dt-border-strong);
	background: var(--dt-surface);
	color: var(--dt-text-2);
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform 0.18s var(--dt-spring);
}
.stepper-btn:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 2));
}
.stepper-btn.is-plus {
	background: var(--dt-accent-strong);
	border-color: transparent;
	color: var(--dt-on-accent);
}
@media (hover: hover) {
	.stepper-btn:hover {
		border-color: var(--dt-hover-border);
		background: var(--dt-hover-bg);
		color: var(--dt-accent-ink);
	}
	.stepper-btn.is-plus:hover {
		border-color: transparent;
		background: var(--dt-accent-strong-hover);
		color: var(--dt-on-accent);
	}
}
.stepper-count {
	min-width: 2.5rem;
	text-align: center;
	font-size: 1.2rem;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.stepper-clear {
	color: var(--dt-danger);
}
.stepper-notes {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	max-width: 15rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.stepper-notes li {
	padding: 0.35rem 0.6rem;
	border-radius: var(--dt-radius-sm);
	background: var(--dt-surface-soft);
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
	overflow-wrap: anywhere;
}
.stepper-notes i {
	margin-right: 0.25rem;
	font-size: 0.65rem;
	color: var(--dt-text-3);
}

.banner-enter-active {
	transition: all 0.4s var(--dt-spring);
}
.banner-leave-active {
	transition: all 0.2s ease;
}
.banner-enter-from,
.banner-leave-to {
	opacity: 0;
	transform: translateY(6px) scale(0.96);
}
</style>

<style>
.fly-emoji {
	position: fixed;
	z-index: 1300;
	font-size: 1.9rem;
	pointer-events: none;
	animation: fly-emoji 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes fly-emoji {
	from {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	to {
		opacity: 0;
		transform: translateY(-120px) scale(1.7);
	}
}
.stepper-pop.p-popover {
	border-radius: var(--dt-radius-lg);
	border: 1px solid var(--dt-border);
	box-shadow: var(--dt-shadow-lg);
}
</style>
