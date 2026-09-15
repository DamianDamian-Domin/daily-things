<template>
	<div class="dp-bar">
		<!-- Prev day -->
		<button
			class="dp-arrow"
			aria-label="Previous day"
			:disabled="!isDateNavEnabled"
			@click="habbitsStore.changeDate(-1)">
			<i class="pi pi-chevron-left"></i>
		</button>

		<!-- Date display -->
		<button
			class="dp-date"
			:disabled="!isDateNavEnabled"
			@click="visible = true">
			<span class="dp-weekday">{{ dateFormated[0] }}</span>
			<span class="dp-full">{{ dateFormated[1] }}</span>
		</button>

		<!-- Next day -->
		<button
			class="dp-arrow"
			aria-label="Next day"
			:disabled="!isDateNavEnabled || habbitsStore.isToday()"
			@click="habbitsStore.changeDate(1)">
			<i class="pi pi-chevron-right"></i>
		</button>

		<!-- Calendar dialog -->
		<Dialog
			v-model:visible="visible"
			modal
			dismissableMask
			:show-header="false"
			class="dp-dialog">
			<div class="dp-dialog-inner">
				<!-- Cozy header -->
				<div class="dp-dialog-top">
					<h4 class="dp-dialog-title">Pick a date</h4>
				</div>
				<img
					class="dp-dialog-flower"
					src="@/assets/logo.png"
					alt=""
					aria-hidden="true" />

				<!-- Calendar -->
				<DatePicker
					v-model="calendarValue"
					@update:modelValue="onDateSelect($event)"
					@month-change="onMonthChange"
					inline
					showWeek
					:maxDate="new Date()"
					class="dp-calendar">
					<template #date="slotProps">
						<div class="dp-custom-day">
							<span>{{ slotProps.date.day }}</span>
							<i
								v-if="habbitsStore.hasHabbitsOnDate(slotProps.date)"
								class="pi pi-bolt dp-day-marker-icon"></i>
						</div>
					</template>
				</DatePicker>
				<!-- Today shortcut -->
				<button
					v-if="!habbitsStore.isToday()"
					class="dp-today-btn"
					@click="goToToday">
					<i
						class="pi pi-home"
						style="font-size: 0.7rem"></i>
					Back to today
				</button>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { useHabbitsStore } from "@/stores/habbits";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { storeToRefs } from "pinia";
import { ref, watch, computed } from "vue";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";

const habbitsStore = useHabbitsStore();
const carouselStore = useCarouselStore();
const { refDate, dateFormated } = storeToRefs(habbitsStore);
const visible = ref(false);
const calendarValue = ref(new Date());

// Nawigacja dat dostępna tylko na karcie habitów
const isDateNavEnabled = computed(
	() => carouselStore.activeCardId === "manage",
);

function onDateSelect(
	selectedDate: undefined | null | Date | Date[] | (null | Date)[],
) {
	if (!selectedDate || Array.isArray(selectedDate)) {
		return;
	}
	const utcDate = new Date(
		Date.UTC(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate(),
		),
	);
	habbitsStore.setDate(utcDate);
	visible.value = false;
}

function goToToday() {
	const now = new Date();
	const utcToday = new Date(
		Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
	);
	habbitsStore.setDate(utcToday);
	calendarValue.value = new Date();
	visible.value = false;
}
function onMonthChange(event: any) {
	if (event && event.year && event.month) {
		// Pobierz dane dla nowego miesiąca w tle!
		habbitsStore.loadHabbitsForMonth(event.year, event.month);
	}
}

watch(
	refDate,
	(newValue) => {
		habbitsStore.loadHabbitsForDate(newValue);
	},
	{ immediate: true },
);
</script>

<style scoped>
/* ====== DATE BAR ====== */
.dp-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	max-width: 480px;
}
@media (max-width: 640px) {
	.dp-bar {
		max-width: 200px;
	}
}

/* Arrow buttons */
.dp-arrow {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 0.65rem;
	border: none;
	background: transparent;
	color: var(--p-gray-500);
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.8rem;
}
.dp-arrow:hover:not(:disabled) {
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	color: var(--p-orange-600);
	transform: scale(1.08);
}
.dp-arrow:active:not(:disabled) {
	transform: scale(0.92);
}
.dp-arrow:disabled {
	opacity: 0.3;
	cursor: not-allowed;
}
:where(.my-app-dark, .my-app-dark *) .dp-arrow {
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .dp-arrow:hover:not(:disabled) {
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
	color: var(--p-orange-400);
}

/* Date button */
.dp-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.1rem;
	padding: 0.35rem 1.2rem;
	border: none;
	background: transparent;
	border-radius: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;
}
.dp-date:hover:not(:disabled) {
	background: color-mix(in srgb, var(--p-orange-50) 60%, transparent);
	transform: scale(1.03);
}
.dp-date:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
:where(.my-app-dark, .my-app-dark *) .dp-date:hover {
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
}
.dp-weekday {
	font-family: "Lora", serif;
	font-size: 1rem;
	font-weight: 700;
	color: var(--p-gray-800);
	line-height: 1.2;
}
:where(.my-app-dark, .my-app-dark *) .dp-weekday {
	color: var(--p-gray-100);
}
.dp-full {
	font-family: "Lora", serif;
	font-size: 0.72rem;
	font-style: italic;
	color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .dp-full {
	color: var(--p-gray-500);
}

/* ====== DIALOG ====== */
:deep(.dp-dialog.p-dialog) {
	border-radius: 1.15rem !important;
	overflow: hidden !important;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
:deep(.dp-dialog .p-dialog-content) {
	padding: 0 !important;
}

.dp-dialog-inner {
	position: relative;
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
}
.dp-dialog-top {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	align-self: flex-start;
	padding-left: 1.8rem;
}
.dp-dialog-flower {
	position: absolute;
	top: 0.45rem;
	left: 0.45rem;
	z-index: 2;
	width: 2.6rem;
	height: 2.6rem;
	object-fit: contain;
	filter: drop-shadow(0 0.35rem 0.35rem rgba(56, 45, 30, 0.18));
	transform: rotate(-8deg);
}
@media (max-width: 640px) {
	:deep(.dp-dialog.p-dialog) {
		width: calc(100% - 2rem) !important;
		max-width: 26rem !important;
		margin: 1rem !important;
	}
	.dp-dialog-inner {
		padding: 1.65rem 1rem 1.5rem;
		gap: 1rem;
	}
	.dp-dialog-top {
		padding-left: 2rem;
	}
	.dp-dialog-flower {
		top: 0.6rem;
		left: 0.45rem;
	}
}
.dp-dialog-title {
	font-family: "Lora", serif;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--p-gray-700);
	margin: 0;
}
:where(.my-app-dark, .my-app-dark *) .dp-dialog-title {
	color: var(--p-gray-200);
}

/* PrimeVue DatePicker overrides */
:deep(.dp-calendar) {
	border: none !important;
	background: transparent !important;
	font-family: "Lora", serif !important;
}
:deep(.dp-calendar .p-datepicker-header) {
	border: none !important;
	background: transparent !important;
	padding: 0.25rem 0 0.5rem !important;
}
:deep(.dp-calendar .p-datepicker-title) {
	font-family: "Lora", serif !important;
	font-weight: 600 !important;
}
:deep(.dp-calendar .p-datepicker-prev-button),
:deep(.dp-calendar .p-datepicker-next-button) {
	width: 2rem !important;
	height: 2rem !important;
	border-radius: 0.6rem !important;
	color: var(--p-gray-700) !important;
	background: color-mix(in srgb, var(--p-orange-100) 40%, transparent)
		!important;
	transition: all 0.2s ease !important;
}
:deep(.dp-calendar .p-datepicker-prev-button:hover),
:deep(.dp-calendar .p-datepicker-next-button:hover) {
	color: var(--p-orange-700) !important;
	background: color-mix(in srgb, var(--p-orange-200) 60%, transparent)
		!important;
	transform: translateY(-1px);
}
:deep(.dp-calendar .p-datepicker-prev-button .p-icon),
:deep(.dp-calendar .p-datepicker-next-button .p-icon) {
	width: 0.9rem !important;
	height: 0.9rem !important;
}
:where(.my-app-dark, .my-app-dark *) :deep(.dp-calendar .p-datepicker-prev-button),
:where(.my-app-dark, .my-app-dark *) :deep(.dp-calendar .p-datepicker-next-button) {
	color: var(--p-gray-100) !important;
	background: color-mix(in srgb, var(--p-gray-700) 55%, transparent)
		!important;
}
:where(.my-app-dark, .my-app-dark *) :deep(.dp-calendar .p-datepicker-prev-button:hover),
:where(.my-app-dark, .my-app-dark *) :deep(.dp-calendar .p-datepicker-next-button:hover) {
	color: var(--p-orange-300) !important;
	background: color-mix(in srgb, var(--p-orange-900) 40%, transparent)
		!important;
}
:deep(.dp-calendar .p-datepicker-calendar td > span) {
	border-radius: 0.5rem !important;
	transition: all 0.15s ease !important;
}
:deep(.dp-calendar .p-datepicker-calendar td > span:hover) {
	background: color-mix(
		in srgb,
		var(--p-orange-100) 60%,
		transparent
	) !important;
}
:deep(.dp-calendar .p-datepicker-calendar td > span.p-datepicker-day-selected),
:deep(.dp-calendar .p-datepicker-calendar td > span.p-highlight) {
	background: var(--p-orange-500) !important;
	color: white !important;
	border-radius: 0.5rem !important;
}
:deep(.dp-calendar .p-datepicker-today > span) {
	border: 1.5px solid var(--p-orange-300) !important;
	background: transparent !important;
	font-weight: 700 !important;
}
:deep(.dp-calendar .p-datepicker-today > span.p-datepicker-day-selected),
:deep(.dp-calendar .p-datepicker-today > span.p-highlight) {
	border-color: var(--p-orange-500) !important;
	background: var(--p-orange-500) !important;
	color: white !important;
}
:deep(.dp-calendar .p-disabled) {
	opacity: 0.3 !important;
}
:deep(.dp-calendar .p-datepicker-weeknumber) {
	color: var(--p-gray-300) !important;
	font-size: 0.65rem !important;
}

/* Today shortcut button */
.dp-today-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: none;
	background: color-mix(in srgb, var(--p-orange-100) 50%, transparent);
	color: var(--p-orange-600);
	font-family: "Lora", serif;
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.4rem 1rem;
	border-radius: 0.55rem;
	cursor: pointer;
	transition: all 0.2s ease;
}
.dp-today-btn:hover {
	background: var(--p-orange-500);
	color: white;
	transform: translateY(-1px);
}
:where(.my-app-dark, .my-app-dark *) .dp-today-btn {
	background: color-mix(in srgb, var(--p-orange-900) 40%, transparent);
	color: var(--p-orange-400);
}
:where(.my-app-dark, .my-app-dark *) .dp-today-btn:hover {
	background: var(--p-orange-600);
	color: white;
}

/* Custom day formatting */
.dp-custom-day {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	position: relative;
}

/* Wymuszamy, aby kalendarz nie obcinał niczego, co wystaje poza dzień */
:deep(.dp-calendar .p-datepicker-calendar td > span) {
	overflow: visible !important;
	position: relative !important;
}
.dp-day-marker-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 0.8rem;
	height: 0.8rem;
	font-size: 0.48rem;
	line-height: 1;
	color: white;
	background: var(--p-orange-500);
	border: 1.5px solid white;
	border-radius: 50%;
	position: absolute;
	right: 0.05rem;
	bottom: 0.05rem;
	z-index: 1;
	box-shadow: 0 1px 3px rgba(84, 55, 25, 0.2);
}

/* Zmiana koloru ikony na białym tle zaznaczonego dnia */
:deep(.dp-calendar .p-datepicker-calendar td > span.p-datepicker-day-selected)
	.dp-day-marker-icon,
:deep(.dp-calendar .p-datepicker-calendar td > span.p-highlight)
	.dp-day-marker-icon {
	color: var(--p-orange-600) !important;
	background: white !important;
	border-color: var(--p-orange-500) !important;
}

:deep(.p-datepicker-prev-icon),
:deep(.p-datepicker-next-icon) {
	color: var(--p-gray-800) !important;
	fill: currentColor !important;
	opacity: 1 !important;
}
:deep(.dp-calendar .p-datepicker-prev-button),
:deep(.dp-calendar .p-datepicker-next-button) {
	position: relative;
}
:deep(.dp-calendar .p-datepicker-prev-button::before),
:deep(.dp-calendar .p-datepicker-next-button::before) {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: Arial, sans-serif;
	font-size: 1.35rem;
	font-weight: 700;
	line-height: 1;
	color: var(--p-gray-800);
}
:deep(.dp-calendar .p-datepicker-prev-button::before) {
	content: "‹";
}
:deep(.dp-calendar .p-datepicker-next-button::before) {
	content: "›";
}
:deep(.dp-calendar .p-datepicker-prev-button .p-icon),
:deep(.dp-calendar .p-datepicker-next-button .p-icon) {
	visibility: hidden;
}
:where(.my-app-dark, .my-app-dark *)
	:deep(.dp-calendar .p-datepicker-prev-button::before),
:where(.my-app-dark, .my-app-dark *)
	:deep(.dp-calendar .p-datepicker-next-button::before) {
	color: var(--p-gray-100);
}
</style>
