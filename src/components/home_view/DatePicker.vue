<template>
	<div
		class="flex flex-row justify-between items-center sm:w-[480px] w-full rounded">
		<div>
			<Button
				icon="pi pi-arrow-left"
				severity="secondary"
				aria-label="Bookmark"
				@click="tasksStore.changeDate(-1)" />
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
				:disabled="tasksStore.isToday()"
				@click="tasksStore.changeDate(1)" />
		</div>
		<Dialog
			v-model:visible="visible"
			modal
			:style="{ width: '31rem' }"
			:closable="false"
			:dismissableMask="true">
			<div>
				<DatePicker
					v-model="calendarValue"
					@update:modelValue="onDateSelect"
					inline
					showWeek
					:maxDate="new Date()" />
			</div>
		</Dialog>
	</div>
</template>

<script setup>
import Button from "primevue/button";
import { useTasksStore } from "@/stores/tasks";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";

const tasksStore = useTasksStore();
const { dateFormated } = storeToRefs(tasksStore);
const visible = ref(false);
const calendarValue = ref(new Date());

function onDateSelect(selectedDate) {
	tasksStore.setDate(selectedDate);
	visible.value = false;
}
</script>

<style scoped></style>
