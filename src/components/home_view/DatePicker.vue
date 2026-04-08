<template>
	<div
		class="flex flex-row justify-between items-center sm:w-[480px] w-full rounded">
		<div>
			<Button
				icon="pi pi-arrow-left"
				severity="secondary"
				rounded
				text
				aria-label="Previous day"
				@click="habbitsStore.changeDate(-1)" />
		</div>

		<div
			class="flex flex-col items-center gap-0.5 hover:cursor-pointer group transition-transform hover:scale-105"
			@click="visible = true">
			<h1 class="text-a font-lora">{{ dateFormated[0] }}</h1>
			<h4 class="text-c font-lora italic">{{ dateFormated[1] }}</h4>
		</div>
		<div>
			<Button
				icon="pi pi-arrow-right"
				severity="secondary"
				rounded
				text
				aria-label="Next day"
				:disabled="habbitsStore.isToday()"
				@click="habbitsStore.changeDate(1)" />
		</div>
		<Dialog
			v-model:visible="visible"
			modal
			:closable="false"
			:dismissableMask="true"
			class="p-2 w-fit">
			<div class="pt-1">
				<DatePicker
					v-model="calendarValue"
					@update:modelValue="onDateSelect($event)"
					inline
					showWeek
					:maxDate="new Date()"
					class="w-full" />
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";

const habbitsStore = useHabbitsStore();
const { refDate, dateFormated } = storeToRefs(habbitsStore);
const visible = ref(false);
const calendarValue = ref(new Date());

function onDateSelect(selectedDate: undefined | null | Date | Date[] | (null | Date)[]) {
	if (!selectedDate || Array.isArray(selectedDate)) {
		return;
	}
	const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    ));
    habbitsStore.setDate(utcDate); 
    visible.value = false;
}

watch(
	refDate,
	(newValue) => {
		habbitsStore.loadHabbitsForDate(newValue);
	},
	{ immediate: true }
);

</script>

<style scoped></style>
