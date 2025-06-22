<template>
	<div
		class="flex flex-row justify-between items-center sm:w-[480px] w-full rounded">
		<div>
			<Button
				icon="pi pi-arrow-left"
				severity="secondary"
				aria-label="Bookmark"
				@click="habbitsStore.changeDate(-1)" />
		</div>

		<div
			class="flex flex-col items-center gap-1 hover:cursor-pointer"
			@click="visible = true">
			<h1 class="text-a">{{ dateFormated[0] }}</h1>
			<h1 class="text-a">{{ dateFormated[1] }}</h1>
		</div>
		<div>
			<Button
				icon="pi pi-arrow-right"
				severity="secondary"
				aria-label="Bookmark"
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
					@update:modelValue="onDateSelect"
					inline
					showWeek
					:maxDate="new Date()"
					class="w-full" />
			</div>
		</Dialog>
	</div>
</template>

<script setup>
import Button from "primevue/button";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";

const habbitsStore = useHabbitsStore();
const { dateFormated } = storeToRefs(habbitsStore);
const visible = ref(false);
const calendarValue = ref(new Date());

function onDateSelect(selectedDate) {
    const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    ));

    habbitsStore.setDate(utcDate); 
    visible.value = false;
}
</script>

<style scoped></style>
