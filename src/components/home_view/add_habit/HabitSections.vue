<template>
	<section
		v-for="section in sections"
		:key="section.key"
		class="add-section"
		:aria-label="section.title">
		<div class="add-section-head">
			<PixelIcon
				:icon="section.icon"
				:palette="section.palette"
				:size="26" />
			<h3 class="dt-section-title">{{ section.title }}</h3>
			<button
				v-if="section.key === 'yours'"
				type="button"
				class="dt-link manage-link"
				@click="managing = !managing">
				{{ managing ? m.done : m.manage }}
			</button>
		</div>
		<div class="add-grid">
			<div
				v-for="h in section.items"
				:key="section.key + h.name"
				class="add-cell">
				<HabitTile
					:habit="h"
					show-label
					:tooltip="false"
					:badge="badgeFor(h)"
					:selected="countFor(h) > 0"
					:aria-label="tileLabel(h)"
					@click="emit('tap', h)" />
				<button
					v-if="managing && section.key === 'yours'"
					type="button"
					class="cell-mini is-delete"
					:aria-label="m.deleteHabit(h.display_name)"
					@click="emit('delete', h)">
					<i
						class="pi pi-trash"
						aria-hidden="true"></i>
				</button>
				<button
					v-else-if="countFor(h) > 0"
					type="button"
					class="cell-mini"
					:aria-label="m.removeOneOf(h.display_name)"
					@click="emit('minus', h)">
					<i
						class="pi pi-minus"
						aria-hidden="true"></i>
				</button>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
// Sekcje z siatką kafelków: dodawanie (stuknięcie), odejmowanie (−) i usuwanie własnych
import { computed } from "vue";
import type { Habit } from "@/libs/types";
import { useHabitsStore } from "@/stores/habits";
import { displayName } from "@/utils/habitCatalog";
import { normalizeSchedule } from "@/utils/goalSchedule";
import HabitTile from "@/components/home_view/HabitTile.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { HabitSection } from "./types";
import { addHabitMessages as m } from "@/i18n/messages/addHabit";

const props = defineProps<{ mode: "log" | "goal"; sections: HabitSection[] }>();
const emit = defineEmits<{
	(e: "tap", h: Habit): void;
	(e: "minus", h: Habit): void;
	(e: "delete", h: Habit): void;
}>();
const managing = defineModel<boolean>("managing", { required: true });

const habitsStore = useHabitsStore();

// Cel tygodniowy ma jeden wpis — jego licznik to „ile razy w tygodniu”
const goalCounts = computed(() => {
	const counts: Record<string, number> = {};
	for (const g of habitsStore.dailyGoalsList) {
		const schedule = normalizeSchedule(g.schedule);
		counts[g.name] = schedule?.kind === "weekly" ? schedule.times : (counts[g.name] ?? 0) + 1;
	}
	return counts;
});
const weeklyNames = computed(
	() =>
		new Set(
			habitsStore.dailyGoalsList
				.filter((g) => normalizeSchedule(g.schedule)?.kind === "weekly")
				.map((g) => g.name),
		),
);
const isWeeklyGoal = (h: Habit) => props.mode === "goal" && weeklyNames.value.has(h.name);

function countFor(h: Habit) {
	return props.mode === "log"
		? (habitsStore.selectedCounts[h.name] ?? 0)
		: (goalCounts.value[h.name] ?? 0);
}

function badgeFor(h: Habit) {
	const n = countFor(h);
	if (n === 0) return null;
	if (isWeeklyGoal(h)) return `${n}/wk`;
	return props.mode === "goal" || n > 1 ? `×${n}` : "✓";
}

function tileLabel(h: Habit) {
	const n = countFor(h);
	const name = displayName(h);
	if (n === 0) return props.mode === "log" ? m.tileLog(name) : m.tileAddGoal(name);
	if (props.mode === "log") return m.tileLoggedAgain(name, n);
	return isWeeklyGoal(h) ? m.tileGoalMoreWeekly(name, n) : m.tileGoalMore(name, n);
}
</script>

<style scoped>
.add-section {
	margin-bottom: 1.1rem;
}
.add-section-head {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	margin-bottom: 0.5rem;
	position: sticky;
	top: -0.5rem;
	z-index: 2;
	padding: 0.25rem 0;
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
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.cell-mini i {
	font-size: 0.6rem;
}
.cell-mini.is-delete {
	background: var(--dt-danger-soft);
	color: var(--dt-danger);
}
.cell-mini:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 2));
}
@media (hover: hover) {
	.cell-mini:hover {
		background: var(--dt-accent-soft);
		color: var(--dt-accent-ink);
		transform: scale(calc(1 + (1 - var(--dt-press)) * 2));
	}
	.cell-mini.is-delete:hover {
		background: color-mix(in srgb, var(--dt-danger) 22%, var(--dt-surface));
		color: var(--dt-danger);
	}
}
</style>
