<template>
	<li
		class="ld-row"
		:class="[`is-${row.fresh}`, { 'is-open': open, 'is-never': row.never && !row.cycle, 'is-cycle': !!row.cycle }]">
		<button
			type="button"
			class="ld-head dt-row"
			:aria-expanded="open"
			:aria-controls="panelId"
			@click="emit('toggle')">
			<span
				class="ld-face"
				:style="{ '--tint': tint, '--tint-strong': tintStrong }">
				<PixelIcon
					:icon="row.habit.icon"
					:palette="palette"
					:muted="row.never"
					:size="28" />
			</span>
			<span class="ld-text">
				<span class="ld-name">{{ name }}</span>
				<span class="ld-sub">{{ subline }}</span>
			</span>
			<span
				class="ld-ago"
				aria-hidden="true"
				>{{ badge }}</span
			>
			<i
				class="pi pi-chevron-down ld-chevron"
				aria-hidden="true"></i>
		</button>

		<div
			v-if="open"
			:id="panelId"
			class="ld-panel">
			<p class="ld-answer">
				<template v-if="row.never">You haven't logged this yet.</template>
				<template v-else>
					Last time: <strong>{{ agoLabel(row.daysAgo) }}</strong>
					<span class="ld-answer-date">{{ formatLong(row.dates[0]) }}</span>
				</template>
			</p>

			<p
				v-if="row.cycle"
				class="ld-facts">
				<span>{{ everyLabel(row.cycle.cycle) }}</span>
				<span
					v-if="row.fresh !== 'fresh'"
					class="ld-due"
					>{{ capitalize(dueLabel(row.cycle.status)) }}</span
				>
				<span v-if="row.cycle.status.daysLeft > 0">next {{ formatShort(row.cycle.status.due) }}</span>
			</p>
			<p
				v-else-if="!row.never"
				class="ld-facts">
				<span>on {{ row.dates.length }} {{ row.dates.length === 1 ? "day" : "days" }}</span>
				<span v-if="rhythm">{{ rhythm }}</span>
				<span
					v-if="row.fresh !== 'fresh'"
					class="ld-due"
					>{{ row.fresh === "overdue" ? "Overdue" : "Due again" }}</span
				>
				<span v-else-if="nextAround">next around {{ nextAround }}</span>
			</p>

			<ol
				v-if="!row.never"
				class="ld-dates"
				aria-label="Days you did it">
				<li
					v-for="key in shownDates"
					:key="key">
					<button
						type="button"
						class="ld-date"
						:aria-label="`Open ${formatLong(key)}`"
						@click="emit('openDay', key)">
						<span>{{ formatLong(key) }}</span>
						<span class="ld-date-ago">{{ agoLabel(daysBetween(key, todayKey)) }}</span>
					</button>
				</li>
			</ol>
			<button
				v-if="!showAll && row.dates.length > PREVIEW"
				type="button"
				class="dt-btn dt-btn-ghost dt-btn-sm ld-more"
				@click="showAll = true">
				Show all {{ row.dates.length }}
			</button>

			<CyclePicker
				:cycle="row.cycle?.cycle ?? null"
				:habit-key="row.name"
				@set="(every, unit) => emit('setCycle', every, unit)" />

			<button
				type="button"
				class="dt-btn dt-btn-soft dt-btn-sm ld-log"
				:disabled="row.daysAgo === 0 && !row.never"
				@click="emit('logToday')">
				<i
					:class="row.daysAgo === 0 && !row.never ? 'pi pi-check' : 'pi pi-plus'"
					aria-hidden="true"></i>
				{{ row.daysAgo === 0 && !row.never ? "Done today" : "Did it today" }}
			</button>
		</div>
	</li>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import type { Habit, HabitCycle } from "@/libs/types";
import { dueLabel, dueShort, everyLabel, type CycleStatus, type CycleUnit } from "@/utils/cycles";
import CyclePicker from "./CyclePicker.vue";
import { addDays, fromDateKey, type DateKey } from "@/utils/date";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import { agoLabel, agoShort, daysBetween, rhythmLabel, type Freshness } from "@/utils/lastDone";
import { PALETTES } from "@/utils/pixelIcons";

export interface LastDoneItem {
	name: string;
	habit: Habit;
	dates: DateKey[];
	count: number;
	daysAgo: number;
	gap: number | null;
	fresh: Freshness;
	never: boolean;
	// Obowiązek cykliczny: termin zamiast „ile temu”
	cycle?: { cycle: HabitCycle; status: CycleStatus };
}

const PREVIEW = 6;

const props = defineProps<{ row: LastDoneItem; open: boolean; todayKey: DateKey }>();
const emit = defineEmits<{
	(e: "toggle"): void;
	(e: "openDay", key: DateKey): void;
	(e: "logToday"): void;
	(e: "setCycle", every: number | null, unit: CycleUnit): void;
}>();

const showAll = ref(false);
watch(
	() => props.open,
	(open) => {
		if (!open) showAll.value = false;
	},
);

const panelId = computed(() => `ld-${props.row.name.replace(/[^a-z0-9]+/gi, "-")}`);
const name = computed(() => displayName(props.row.habit));
const palette = computed(() => paletteFor(props.row.habit));
const tint = computed(() => PALETTES[palette.value].h);
const tintStrong = computed(() => PALETTES[palette.value].f);
const rhythm = computed(() => rhythmLabel(props.row.gap));
const shownDates = computed(() => (showAll.value ? props.row.dates : props.row.dates.slice(0, PREVIEW)));

const badge = computed(() => {
	if (props.row.cycle) return dueShort(props.row.cycle.status);
	return props.row.never ? "never" : agoShort(props.row.daysAgo);
});

const subline = computed(() => {
	if (props.row.cycle) {
		const last = props.row.never ? "not logged yet" : `last ${formatLong(props.row.dates[0])}`;
		return `${everyLabel(props.row.cycle.cycle)} · ${last}`;
	}
	if (props.row.never) return "Not logged yet";
	const times = props.row.count === 1 ? "once" : `${props.row.count}×`;
	return `${formatLong(props.row.dates[0])} · ${times}`;
});

// Plakietka po prawej mówi „ile temu”, podpis — konkretny dzień
const nextAround = computed(() => {
	if (props.row.gap === null || props.row.gap < 2) return null;
	const next = addDays(fromDateKey(props.row.dates[0]), Math.round(props.row.gap));
	return next.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
});

function formatShort(key: DateKey) {
	return fromDateKey(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function formatLong(key: DateKey) {
	const date = fromDateKey(key);
	const sameYear = date.getFullYear() === fromDateKey(props.todayKey).getFullYear();
	return date.toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		...(sameYear ? {} : { year: "numeric" }),
	});
}
</script>

<style scoped>
.ld-row {
	--fresh: var(--dt-success);
	list-style: none;
	border-radius: var(--dt-radius-lg);
	transition: background-color var(--dt-t-fast) ease;
}
.ld-row.is-due {
	--fresh: var(--dt-gold);
}
.ld-row.is-overdue {
	--fresh: var(--dt-danger);
}
.ld-row.is-never {
	--fresh: var(--dt-text-3);
}
.ld-row.is-open {
	background: var(--dt-surface-soft);
	box-shadow: inset 0 0 0 1px var(--dt-border);
}
.ld-head {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.5rem 0.6rem;
	border: 0;
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}
.ld-head:focus-visible {
	outline: 2px solid var(--dt-focus);
	outline-offset: 1px;
}
.ld-face {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 0.8rem;
	background: color-mix(in srgb, var(--tint) 34%, var(--dt-surface));
	box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--tint-strong) 22%, transparent);
}
:where(.my-app-dark) .ld-face {
	background: color-mix(in srgb, var(--tint-strong) 16%, var(--dt-surface));
}
.is-never .ld-face {
	background: var(--dt-surface-sunken);
	box-shadow: none;
}
.ld-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}
.ld-name {
	font-weight: 700;
	color: var(--dt-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ld-sub {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
}
.ld-ago {
	flex-shrink: 0;
	min-width: 3.1rem;
	padding: 0.2rem 0.55rem;
	border-radius: var(--dt-radius-pill);
	text-align: center;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: color-mix(in srgb, var(--fresh) 70%, var(--dt-text));
	background: color-mix(in srgb, var(--fresh) 16%, var(--dt-surface));
}
.ld-row.is-cycle .ld-ago {
	min-width: 3.6rem;
}
.ld-chevron {
	font-size: 0.75rem;
	color: var(--dt-text-3);
	transition: transform var(--dt-t) var(--dt-ease);
}
.is-open .ld-chevron {
	transform: rotate(180deg);
}

.ld-panel {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.6rem;
	padding: 0.15rem 0.85rem 0.85rem 4.05rem;
}
.ld-answer {
	margin: 0;
	font-size: var(--dt-text-md);
	color: var(--dt-text);
}
.ld-answer strong {
	color: color-mix(in srgb, var(--fresh) 70%, var(--dt-text));
}
.ld-answer-date {
	display: block;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.ld-facts {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	margin: 0;
}
.ld-facts span {
	padding: 0.15rem 0.55rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-sunken);
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
}
.ld-facts .ld-due {
	background: color-mix(in srgb, var(--fresh) 18%, var(--dt-surface));
	color: color-mix(in srgb, var(--fresh) 70%, var(--dt-text));
	font-weight: 700;
}
.ld-dates {
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
	width: 100%;
	margin: 0;
	padding: 0 0 0 0.75rem;
	border-left: 2px dashed var(--dt-border-strong);
}
.ld-dates li {
	list-style: none;
}
.ld-date {
	position: relative;
	display: flex;
	justify-content: space-between;
	gap: 0.5rem;
	width: 100%;
	padding: 0.3rem 0.5rem;
	border: 0;
	border-radius: var(--dt-radius-sm);
	background: transparent;
	color: var(--dt-text);
	font: inherit;
	font-size: var(--dt-text-sm);
	text-align: left;
	cursor: pointer;
}
.ld-date::before {
	content: "";
	position: absolute;
	left: calc(-0.75rem - 5px);
	top: 50%;
	width: 8px;
	height: 8px;
	border-radius: 2px;
	transform: translateY(-50%);
	background: var(--dt-accent);
}
.ld-dates li:first-child .ld-date::before {
	background: var(--fresh);
}
.ld-date-ago {
	color: var(--dt-text-3);
	font-size: var(--dt-text-xs);
	white-space: nowrap;
}
@media (hover: hover) {
	.ld-head:hover {
		background: var(--dt-hover-bg);
	}
	.ld-date:hover {
		background: var(--dt-hover-bg);
	}
}
.ld-date:focus-visible {
	outline: 2px solid var(--dt-focus);
}
.ld-more {
	margin-left: 0.25rem;
}
@media (max-width: 420px) {
	.ld-panel {
		padding-left: 0.85rem;
	}
}
</style>
