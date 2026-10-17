<template>
	<div
		class="dp-bar"
		role="group"
		:aria-label="m.chooseDay">
		<button
			type="button"
			class="dt-icon-btn"
			:aria-label="m.previousDay"
			@click="habitsStore.changeDate(-1)">
			<i
				class="pi pi-chevron-left"
				aria-hidden="true"></i>
		</button>

		<button
			type="button"
			class="dp-date"
			:aria-label="m.openCalendar(title.weekday, title.full)"
			@click="open">
			<span class="dp-weekday">{{ relativeLabel || title.weekday }}</span>
			<span class="dp-full">{{ title.full }}</span>
		</button>

		<button
			type="button"
			class="dt-icon-btn"
			:aria-label="m.nextDay"
			:disabled="habitsStore.isSelectedToday"
			@click="habitsStore.changeDate(1)">
			<i
				class="pi pi-chevron-right"
				aria-hidden="true"></i>
		</button>

		<Transition name="dp-today">
			<button
				v-if="!habitsStore.isSelectedToday"
				type="button"
				class="dt-btn dt-btn-soft dt-btn-sm dp-today-pill"
				@click="habitsStore.goToToday()">
				{{ common.today }}
			</button>
		</Transition>

		<Dialog
			v-model:visible="visible"
			modal
			dismissable-mask
			:show-header="false"
			:pt="{ mask: { class: 'dt-dialog-mask' }, root: { 'aria-label': m.calendar } }"
			class="dt-dialog dp-dialog">
			<div class="dp-dialog-inner">
				<h2 class="dt-title dp-dialog-title">{{ m.pickADay }}</h2>
				<PrimeDatePicker
					v-model="calendarValue"
					inline
					:max-date="new Date()"
					:first-day-of-week="1"
					class="dp-calendar"
					@update:model-value="onSelect"
					@month-change="onMonthChange">
					<template #date="{ date }">
						<span
							class="dp-day"
							:class="{ 'has-logs': hasLogs(date) }">
							{{ date.day }}
						</span>
					</template>
				</PrimeDatePicker>
				<p class="dp-legend">
					<span
						class="dp-legend-dot"
						aria-hidden="true"></span>
					{{ m.daysWithLogs }}
				</p>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import PrimeDatePicker from "primevue/datepicker";
import { useHabitsStore } from "@/stores/habits";
import { addDays, formatDayTitle, toDateKey } from "@/utils/date";
import { habitsMessages as m } from "@/i18n/messages/habits";
import { commonMessages as common } from "@/i18n/messages/common";

const habitsStore = useHabitsStore();
const visible = ref(false);
const calendarValue = ref<Date>(new Date());

const title = computed(() => formatDayTitle(habitsStore.selectedDate));
const relativeLabel = computed(() => {
	const key = habitsStore.selectedKey;
	if (key === habitsStore.todayKey) return common.today;
	if (key === toDateKey(addDays(new Date(), -1))) return common.yesterday;
	return "";
});

function open() {
	calendarValue.value = new Date(habitsStore.selectedDate);
	const d = habitsStore.selectedDate;
	habitsStore.ensureMonth(d.getFullYear(), d.getMonth());
	visible.value = true;
}

function onSelect(value: unknown) {
	if (!(value instanceof Date)) return;
	habitsStore.setDate(value);
	visible.value = false;
}

// PrimeVue podaje miesiąc 1-12
function onMonthChange(event: { month: number; year: number }) {
	habitsStore.ensureMonth(event.year, event.month - 1);
}

function hasLogs(date: { day: number; month: number; year: number }) {
	return habitsStore.hasLogsOn(toDateKey(new Date(date.year, date.month, date.day)));
}
</script>

<style scoped>
.dp-bar {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
}
.dp-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 11rem;
	padding: 0.3rem 0.9rem;
	border: none;
	border-radius: var(--dt-radius);
	background: transparent;
	color: var(--dt-text);
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-ease);
}
.dp-date:active {
	transform: scale(var(--dt-press));
}
@media (hover: hover) {
	.dp-date:hover {
		background: var(--dt-hover-bg);
	}
	.dp-date:hover .dp-full {
		color: var(--dt-accent-ink);
	}
}
.dp-weekday {
	font-size: var(--dt-text-md);
	font-weight: 700;
	line-height: 1.2;
}
.dp-full {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	transition: color var(--dt-t-fast) ease;
}
.dp-today-pill {
	position: absolute;
	right: -4.5rem;
}
@media (max-width: 640px) {
	.dp-date {
		min-width: 8.5rem;
		padding: 0.25rem 0.5rem;
	}
	.dp-today-pill {
		position: static;
		margin-left: 0.15rem;
	}
}
.dp-today-enter-active,
.dp-today-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.dp-today-enter-from,
.dp-today-leave-to {
	opacity: 0;
	transform: scale(0.85);
}

.dp-dialog-inner {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1.25rem;
}
.dp-dialog-title {
	text-align: center;
}
.dp-day {
	position: relative;
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
}
.dp-day.has-logs::after {
	content: "";
	position: absolute;
	bottom: 2px;
	left: 50%;
	width: 5px;
	height: 5px;
	margin-left: -2.5px;
	border-radius: 50%;
	background: var(--dt-accent);
}
.dp-legend {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.dp-legend-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--dt-accent);
}
:deep(.dp-calendar .p-datepicker-panel) {
	border: none;
	background: transparent;
}
</style>
