<template>
    <div class="w-full flex flex-row justify-between">
        <div class="flex flex-row items-center gap-2">
            <img class="w-20" src="@/assets/logo.png" alt="">
            <h1> Daily Things </h1>

        </div>
        <div class="flex flex-row items-center gap-2">
            <Button class="w-12 h-12" text v-if="isDarkMode" icon="pi pi-sun" severity="secondary" @click="toggleDarkMode()" />
            <Button class="w-12 h-12" text v-else icon="pi pi-moon" severity="secondary" @click="toggleDarkMode()" />
            <Button class="w-12 h-12" rounded icon="pi pi-ellipsis-v" severity="secondary"></Button>
            <Button class="w-12 h-12" rounded label="DD" severity="primary"></Button>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Button from 'primevue/button';
import { useCommonStore } from '@/stores/common'
import { storeToRefs } from 'pinia';

const commonStore = useCommonStore()
const { isDarkMode } = storeToRefs(commonStore)

const toggleDarkMode = () => {

    isDarkMode.value = !isDarkMode.value
    if (isDarkMode.value) {
        document.documentElement.classList.add('my-app-dark')
        localStorage.setItem('theme', 'dark')
    } else {
        document.documentElement.classList.remove('my-app-dark')
        localStorage.setItem('theme', 'light')
    }

}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
        isDarkMode.value = savedTheme === 'dark'
    } else {
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    if (isDarkMode.value) {
        document.documentElement.classList.add('my-app-dark')
    }

})

</script>
