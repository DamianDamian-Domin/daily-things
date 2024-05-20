<template>
    <div class="flex flex-col card-a sm:w-[480px] w-full h-4/5 min-h-[30rem] max-h-[50rem]">
        <div class=" text-center">
            <h3> You are doing well ! </h3>
        </div>
        <div class="tasks-area mt-8 h-2/3">
            <div class="flex flex-row flex-wrap h-min gap-2">
                <TaskItem v-for="task in 10" :key="task" :data="{severity: 'danger', icon: 'fitness_center'}"></TaskItem>
            </div>
        </div>
        <div class="flex flex-col gap-6 flex-grow">
            <div class="text-center">
                <h3> Daily goals </h3>
            </div>
            <div class="flex flex-row flex-wrap h-min gap-2">
                <TaskItem v-for="task in 5" :key="task" :data="{severity: 'empty', icon: 'fitness_center'}"></TaskItem>
                <TaskItem :data="{severity: 'empty', icon: 'add'}"></TaskItem>
            </div>
        </div>
    </div>
</template>

<script setup>
import TaskItem from '@/components/home_view/TaskItem.vue'

</script>

