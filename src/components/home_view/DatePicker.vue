<template>
    <div class="flex flex-row justify-between items-center sm:w-[480px] w-full  rounde">
        <div>
            <Button :pt="{
                root: 'surface-content-c hover:opacity-75 border-none rounded-[40%] text-c',
                icon: 'text-c'
            }"
            :pt-options="{
                mergeProps: true,
                mergeSections: true
            }"  
            icon="pi pi-arrow-left" severity="secondary"  aria-label="Bookmark" @click="tasksStore.changeDate(-1)" />
        </div>
        <div class="flex flex-col items-center gap-1">

            <h1> {{ dateFormated[0] }} </h1>
            <h1> {{ dateFormated[1] }} </h1>
        </div>
        <div>
            <Button :pt="{
                root: 'surface-content-c hover:opacity-75 border-none rounded-[40%] text-c',
                icon: 'text-c'
            }"
            :pt-options="{
                mergeProps: true,
                mergeSections: true
            }" 
            icon="pi pi-arrow-right" severity="secondary" aria-label="Bookmark" @click="tasksStore.changeDate(1)" />
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import { useTasksStore } from '@/stores/tasks'
import { storeToRefs } from 'pinia';

const tasksStore = useTasksStore()
const { dateFormated } = storeToRefs(tasksStore)




</script>

<style scoped>

</style>