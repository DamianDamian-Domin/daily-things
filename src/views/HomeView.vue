<template>
  <div class="flex flex-col gap-6 items-center flex-grow">
    <DatePicker></DatePicker>
    <HabbitsCard></HabbitsCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useHabbitsStore } from '../stores/habbits';
import DatePicker from '@/components/home_view/DatePicker.vue';
import HabbitsCard from '@/components/home_view/HabbitsCard.vue'

const habbitsStore = useHabbitsStore();

onMounted(() => {
  habbitsStore.getDailyHabbitsInRange()
  habbitsStore.loadDailyGoals();
});
</script>

<style scoped>

</style>