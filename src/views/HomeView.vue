<template>
	<div class="flex flex-col gap-2 items-center flex-grow">
		<DatePicker></DatePicker>
		<CarouselView />
	</div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useHabbitsStore } from "../stores/habbits";
import DatePicker from "@/components/home_view/DatePicker.vue";
import CarouselView from "./CarouselView.vue";

const habbitsStore = useHabbitsStore();

onMounted(() => {
	habbitsStore.getDailyHabbitsInRange();
	habbitsStore.loadDailyGoals();
	habbitsStore.loadRecentHabbits();
});
</script>

<style scoped></style>
