<template>
	<div
		class="flex flex-col gap-2 items-center flex-grow min-h-0 sm:gap-2 px-0 sm:px-0 w-full">
		<div
			class="w-full px-3 pt-2 sm:px-0 sm:pt-0 flex items-center justify-center relative min-h-[2rem]">
			<div class="sm:hidden absolute left-3 shrink-0">
				<img
					src="@/assets/logo.png"
					alt="Daily Things"
					class="w-8 h-8 object-contain" />
			</div>

			<DatePicker class="shrink-0"></DatePicker>
		</div>

		<CarouselView class="flex-1 min-h-0 w-full" />
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
