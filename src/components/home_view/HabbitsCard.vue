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
			<div
				v-if="habbitsStore.streak > 0"
				class="streak-chip"
				:class="{ 'at-risk': habbitsStore.streakAtRisk }"
				role="img"
				:aria-label="`${habbitsStore.streak}-day streak`"
				v-tooltip.bottom="streakTooltip">
				<PixelIcon
					icon="local_fire_department"
					:palette="habbitsStore.streakAtRisk ? 'gray' : 'orange'"
					:size="22" />
				<span>{{ habbitsStore.streak }}</span>
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
							v-if="progress.total > 0"
							class="panel-hint">
							{{ goalsHint }}
						</p>
					</div>
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						@click="openDialog('goal')">
						<i
							class="pi pi-pencil"
							aria-hidden="true"></i>
						{{ progress.total > 0 ? "Edit" : "Set goals" }}
					</button>
				</div>

				<Transition name="banner">
					<p
						v-if="progress.complete"
						class="goals-banner"
						role="status">
						🌟 All goals done{{ habbitsStore.isSelectedToday ? " for today" : "" }}! Well
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
							:habbit="goal.habbit"
							:muted="goal.done === 0"
							:done="goal.done >= goal.target"
							:badge="goalBadge(goal)"
							:progress="goal.target > 1 ? goal.done / goal.target : null"
							:aria-label="goalAria(goal)"
							:pressed="goal.done >= goal.target"
							@click="(e: MouseEvent) => onGoalTap(goal, e)" />
					</template>
				</draggable>

				<div
					v-else
					class="goals-empty">
					<PixelIcon
						icon="flag"
						palette="yellow"
						:size="34" />
					<p>
						Pick 2–3 small things you'd like to do every day. Tapping a goal logs it — that's it.
					</p>
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						@click="openDialog('goal')">
						Choose goals
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
								:habbit="group.habbit"
								:badge="group.count > 1 ? `×${group.count}` : null"
								:selected="stepperFor === group.name"
								:aria-label="`${group.habbit.display_name}, logged ${group.count} ${group.count === 1 ? 'time' : 'times'}. Edit`"
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
				:aria-label="`Edit ${stepperGroup.habbit.display_name}`">
				<p class="stepper-name">{{ stepperGroup.habbit.display_name }}</p>
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
				<button
					v-if="stepperGroup.count > 1"
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm stepper-clear"
					@click="removeAll">
					Remove all
				</button>
			</div>
		</Popover>

		<AddHabitDialog
			v-model="dialogOpen"
			:mode="dialogMode"
			@logged="markTap" />
	</section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import Popover from "primevue/popover";
import draggable from "vuedraggable";
import type { GroupedGoal, GroupedHabbit } from "@/libs/types";
import { useHabbitsStore } from "@/stores/habbits";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useSound } from "@/utils/useSound";
import { useConfetti } from "@/utils/useConfetti";
import { randomCheer } from "@/utils/useCompliment";
import { formatDayTitle, partOfDay } from "@/utils/date";
import { displayName } from "@/utils/habitCatalog";
import HabitTile from "@/components/home_view/HabitTile.vue";
const AddHabitDialog = defineAsyncComponent(
	() => import("@/components/home_view/AddHabitDialog.vue"),
);
import PixelIcon from "@/components/ui/PixelIcon.vue";

defineProps<{ isActive: boolean }>();

const habbitsStore = useHabbitsStore();
const authStore = useAuthStore();
const toast = useToastStore();
const preferences = usePreferencesStore();
const { playHabitCheck, playUncheck, playVictory } = useSound();
const { launch: launchConfetti } = useConfetti();

// ==========================================================================
// NAGŁÓWEK
// ==========================================================================
const dayPart = computed(() => partOfDay());

const headline = computed(() => {
	if (!habbitsStore.isSelectedToday) return formatDayTitle(habbitsStore.selectedDate).weekday;
	const name = authStore.firstName;
	return name ? `${dayPart.value.greeting}, ${name}` : dayPart.value.greeting;
});

const progress = computed(() => habbitsStore.goalsProgress);
const ringPct = computed(() =>
	progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 0,
);

const subline = computed(() => {
	if (!habbitsStore.isSelectedToday) return "Looking back — you can still fill in this day.";
	if (habbitsStore.streakAtRisk)
		return `Log anything today to keep your ${habbitsStore.streak}-day streak 🔥`;
	const { done, total, complete } = progress.value;
	if (complete) return "Everything's done. Enjoy the rest of your day ☕";
	if (total > 0 && done === 0) return "A fresh day. Start with the easiest goal.";
	if (total > 0) return `${total - done} to go — you've got this.`;
	if (habbitsStore.selectedLogs.length > 0) return "Nice rhythm today. Keep it gentle.";
	return "Small steps count. What's one thing you'll do today?";
});

const streakTooltip = computed(() =>
	habbitsStore.streakAtRisk
		? `${habbitsStore.streak}-day streak — log something today to keep it`
		: `${habbitsStore.streak}-day streak — keep it going!`,
);

const goalsHint = computed(() => {
	const left = progress.value.total - progress.value.done;
	if (progress.value.complete) return "Perfect day ✨";
	return `${left} left · tap a goal to log it`;
});

// ==========================================================================
// CELE
// ==========================================================================
const goalTiles = computed<GroupedGoal[]>({
	get: () => habbitsStore.groupedGoals,
	set: (list) => habbitsStore.reorderGoals(list.map((g) => g.name)),
});

function goalBadge(goal: GroupedGoal) {
	if (goal.done >= goal.target) return "✓";
	if (goal.target > 1) return `${goal.done}/${goal.target}`;
	return null;
}

function goalAria(goal: GroupedGoal) {
	const name = displayName(goal.habbit);
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
	const result = habbitsStore.tapGoal(goal);
	if (result === "logged") {
		const done = goal.done + 1;
		const suffix = goal.target > 1 ? ` (${Math.min(done, goal.target)}/${goal.target})` : "";
		toast.undoable(`${displayName(goal.habbit)}${suffix} — ${randomCheer()}`, () =>
			habbitsStore.unlogHabbit(goal.name),
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
		if (complete && was === false && byUser && habbitsStore.isSelectedToday) {
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
const goalNames = computed(() => new Set(habbitsStore.groupedGoals.map((g) => g.name)));
const loggedTiles = computed<GroupedHabbit[]>({
	get: () => habbitsStore.groupedSelectedDayHabbits.filter((g) => !goalNames.value.has(g.name)),
	set: (list) =>
		habbitsStore.reorderSelected([
			...habbitsStore.groupedSelectedDayHabbits
				.filter((g) => goalNames.value.has(g.name))
				.map((g) => g.name),
			...list.map((g) => g.name),
		]),
});
const otherLogsCount = computed(() => loggedTiles.value.reduce((sum, g) => sum + g.count, 0));

const loggedHeading = computed(() => {
	if (goalNames.value.size > 0) return "Also logged";
	return habbitsStore.isSelectedToday ? "Logged today" : "Logged that day";
});
const loggedEmptyText = computed(() => {
	if (goalNames.value.size > 0) return "Did something else nice? Tap + to add it.";
	return habbitsStore.isSelectedToday
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
	habbitsStore.groupedSelectedDayHabbits.find((g) => g.name === stepperFor.value),
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
	habbitsStore.logHabbit(group.habbit);
}

async function stepDown() {
	const group = stepperGroup.value;
	if (!group) return;
	playUncheck();
	const name = group.name;
	const removed = habbitsStore.unlogHabbit(name);
	if (!removed) return;
	if (!stepperGroup.value) stepperRef.value?.hide();
	toast.undoable(`Removed ${displayName(group.habbit)}`, () =>
		habbitsStore.restoreLogs([removed]),
	);
}

async function removeAll() {
	const group = stepperGroup.value;
	if (!group) return;
	stepperRef.value?.hide();
	playUncheck();
	const removed = habbitsStore.removeAllLogs(group.name);
	if (removed.length)
		toast.undoable(`Removed ${displayName(group.habbit)} ×${removed.length}`, () =>
			habbitsStore.restoreLogs(removed),
		);
}

// Zmiana dnia zamyka stepper
watch(
	() => habbitsStore.selectedKey,
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
.goals-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	text-align: center;
	padding: 0.25rem 0.5rem 0.35rem;
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
	gap: 0.85rem 0.75rem;
}
.contents {
	display: contents;
}
.tile-ghost {
	opacity: 0.35;
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
		background-color 0.18s ease,
		transform 0.22s var(--dt-spring);
}
.add-tile:hover {
	background: var(--dt-accent-softer);
	transform: translateY(-2px);
}
.add-tile:active {
	transform: scale(0.93);
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
	transition: transform 0.18s var(--dt-spring);
}
.stepper-btn:active {
	transform: scale(0.9);
}
.stepper-btn.is-plus {
	background: var(--dt-accent-strong);
	border-color: transparent;
	color: var(--dt-on-accent);
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
