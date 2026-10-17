<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'schedule-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog schedule-dialog">
		<div class="sch-shell">
			<div class="sch-head">
				<span
					class="sch-emoji"
					aria-hidden="true"
					>🗓️</span
				>
				<div class="sch-head-text">
					<h2
						id="schedule-title"
						class="dt-title">
						Weekly routine
					</h2>
					<p class="dt-subtitle">
						Choose how often each goal comes up. Days off never break your streak.
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

			<ul
				v-if="rows.length"
				class="sch-list">
				<li
					v-for="row in rows"
					:key="row.name"
					class="sch-row">
					<div class="sch-top">
						<span class="sch-icon">
							<PixelIcon
								:icon="row.habit.icon"
								:palette="paletteFor(row.habit)"
								:size="28" />
						</span>
						<span class="sch-name">
							{{ row.label }}
							<small>{{ row.summary }}</small>
						</span>
					</div>

					<div
						class="sch-kinds"
						role="radiogroup"
						:aria-label="`How often: ${row.label}`">
						<button
							v-for="kind in KINDS"
							:key="kind.key"
							type="button"
							role="radio"
							class="sch-kind"
							:class="{ 'is-on': row.kind === kind.key }"
							:aria-checked="row.kind === kind.key"
							@click="setKind(row, kind.key)">
							{{ kind.label }}
						</button>
					</div>

					<div
						v-if="row.kind === 'days'"
						class="sch-days"
						role="group"
						:aria-label="`Days for ${row.label}`">
						<button
							v-for="(letter, i) in WEEKDAY_LETTER"
							:key="i"
							type="button"
							class="sch-day"
							:class="{ 'is-on': row.days.includes(i) }"
							:aria-pressed="row.days.includes(i)"
							:aria-label="WEEKDAY_SHORT[i]"
							@click="toggleDay(row, i)">
							{{ letter }}
						</button>
					</div>

					<div
						v-else-if="row.kind === 'weekly'"
						class="sch-times">
						<button
							type="button"
							class="stepper-btn"
							:disabled="row.times <= 1"
							:aria-label="`Fewer times a week for ${row.label}`"
							@click="setTimes(row, row.times - 1)">
							<i
								class="pi pi-minus"
								aria-hidden="true"></i>
						</button>
						<span
							class="sch-times-value"
							aria-live="polite"
							>{{ row.times }}× a week</span
						>
						<button
							type="button"
							class="stepper-btn is-plus"
							:disabled="row.times >= MAX_WEEKLY_TIMES"
							:aria-label="`More times a week for ${row.label}`"
							@click="setTimes(row, row.times + 1)">
							<i
								class="pi pi-plus"
								aria-hidden="true"></i>
						</button>
					</div>
				</li>
			</ul>

			<div
				v-else
				class="dt-empty sch-empty">
				<PixelIcon
					icon="flag"
					palette="yellow"
					:size="44" />
				<p>Pick a goal first, then choose the days it belongs to.</p>
			</div>

			<div class="sch-foot">
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
import { computed } from "vue";
import Dialog from "primevue/dialog";
import type { GoalSchedule, Habit } from "@/libs/types";
import { useHabitsStore } from "@/stores/habits";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import {
	MAX_WEEKLY_TIMES,
	WEEKDAY_LETTER,
	WEEKDAY_SHORT,
	normalizeSchedule,
	scheduleLabel,
} from "@/utils/goalSchedule";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const visible = defineModel<boolean>({ default: false });

const habitsStore = useHabitsStore();

type Kind = "daily" | "days" | "weekly";
const KINDS: Array<{ key: Kind; label: string }> = [
	{ key: "daily", label: "Every day" },
	{ key: "days", label: "On days" },
	{ key: "weekly", label: "Weekly" },
];
// Domyślne wybory przy przełączeniu: pon/śr/pt albo 3× w tygodniu
const DEFAULT_DAYS = [0, 2, 4];
const DEFAULT_TIMES = 3;

interface Row {
	name: string;
	habit: Habit;
	label: string;
	summary: string;
	kind: Kind;
	days: number[];
	times: number;
	perDay: number;
}

const rows = computed<Row[]>(() => {
	const seen = new Map<string, number>();
	for (const g of habitsStore.dailyGoalsList) seen.set(g.name, (seen.get(g.name) ?? 0) + 1);
	return [...seen.entries()].map(([name, perDay]) => {
		const goal = habitsStore.dailyGoalsList.find((g) => g.name === name)!;
		const habit = habitsStore.resolve(goal);
		const schedule = normalizeSchedule(goal.schedule);
		const label = scheduleLabel(schedule);
		return {
			name,
			habit,
			label: displayName(habit),
			summary: perDay > 1 && schedule?.kind !== "weekly" ? `${label}, ${perDay}× a day` : label,
			kind: schedule?.kind ?? "daily",
			days: schedule?.kind === "days" ? schedule.days : [],
			times: schedule?.kind === "weekly" ? schedule.times : DEFAULT_TIMES,
			perDay,
		};
	});
});

function save(row: Row, schedule: GoalSchedule | null) {
	habitsStore.setGoalSchedule(row.name, schedule);
}

function setKind(row: Row, kind: Kind) {
	if (kind === row.kind) return;
	if (kind === "daily") save(row, null);
	else if (kind === "days") save(row, { kind: "days", days: DEFAULT_DAYS });
	else save(row, { kind: "weekly", times: DEFAULT_TIMES });
}

function toggleDay(row: Row, day: number) {
	const days = row.days.includes(day) ? row.days.filter((d) => d !== day) : [...row.days, day];
	// Ostatni odznaczony dzień albo wszystkie 7 — wracamy do „codziennie”
	save(row, days.length === 0 ? null : { kind: "days", days });
}

function setTimes(row: Row, times: number) {
	if (times < 1 || times > MAX_WEEKLY_TIMES) return;
	save(row, { kind: "weekly", times });
}
</script>

<style scoped>
.sch-shell {
	display: flex;
	flex-direction: column;
	max-height: min(86dvh, 44rem);
	background: var(--dt-surface);
}
.sch-head {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 1.1rem 1rem 0.6rem 1.25rem;
}
.sch-head-text {
	flex: 1;
	min-width: 0;
}
.sch-emoji {
	display: grid;
	place-items: center;
	width: 2.7rem;
	height: 2.7rem;
	border-radius: 0.9rem;
	font-size: 1.35rem;
	background: var(--dt-accent-soft);
	flex-shrink: 0;
}

.sch-list {
	list-style: none;
	margin: 0;
	padding: 0.25rem 1.25rem 0.75rem;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.sch-row {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
	padding: 0.6rem 0.7rem 0.7rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.sch-top {
	display: flex;
	align-items: center;
	gap: 0.65rem;
}
.sch-icon {
	display: grid;
	place-items: center;
	flex-shrink: 0;
}
.sch-name {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	font-weight: 600;
	color: var(--dt-text);
	line-height: 1.25;
	overflow-wrap: anywhere;
}
.sch-name small {
	font-weight: 400;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}

.sch-kinds {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.25rem;
	padding: 0.2rem;
	border-radius: 999px;
	background: var(--dt-surface);
	border: 1px solid var(--dt-border);
}
.sch-kind {
	min-height: 2.25rem;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: var(--dt-text-2);
	font: inherit;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.15s,
		color 0.15s;
}
.sch-kind:hover {
	color: var(--dt-text);
}
.sch-kind.is-on {
	background: var(--dt-accent);
	color: var(--dt-on-accent, #fff);
}
.sch-kind:focus-visible,
.sch-day:focus-visible {
	outline: 2px solid var(--dt-accent);
	outline-offset: 2px;
}

.sch-days {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.3rem;
}
.sch-day {
	aspect-ratio: 1;
	max-height: 2.6rem;
	border-radius: 999px;
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	color: var(--dt-text-2);
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	transition:
		background 0.15s,
		color 0.15s,
		border-color 0.15s;
}
.sch-day.is-on {
	background: var(--dt-accent-soft);
	border-color: var(--dt-accent);
	color: var(--dt-accent-ink);
}

.sch-times {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.9rem;
}
.sch-times-value {
	min-width: 6.5rem;
	text-align: center;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: var(--dt-text);
}
.stepper-btn {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 999px;
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	color: var(--dt-text);
	cursor: pointer;
}
.stepper-btn.is-plus {
	background: var(--dt-accent-soft);
	border-color: transparent;
	color: var(--dt-accent-ink);
}
.stepper-btn:disabled {
	opacity: 0.4;
	cursor: default;
}

.sch-empty {
	padding: 1.25rem 1.5rem 1.5rem;
}
.sch-empty p {
	margin: 0;
	color: var(--dt-text-2);
	font-size: var(--dt-text-sm);
	line-height: 1.5;
	text-align: center;
}

.sch-foot {
	display: flex;
	justify-content: flex-end;
	padding: 0.75rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
	border-top: 1px solid var(--dt-border);
	background: var(--dt-surface-soft);
}
</style>

<style>
.schedule-dialog.p-dialog {
	width: min(96vw, 30rem);
}
@media (max-width: 640px) {
	.schedule-dialog.p-dialog {
		width: 100vw;
		max-height: 100dvh;
		margin: 0;
		align-self: flex-end;
		border-radius: var(--dt-radius-xl) var(--dt-radius-xl) 0 0 !important;
	}
}
</style>
