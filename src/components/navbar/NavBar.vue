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
            <Button @click="toggle" class="w-12 h-12" rounded label="DD" severity="primary"></Button>
            <Popover ref="op">
                <div class="flex flex-col gap-2 w-[12rem]">
                    <Button size="small" text label="Profile" icon="pi pi-user" severity="secondary" />
                    <Button size="small" text label="Settings" icon="pi pi-cog" severity="secondary" />
                    <Button @click="authStore.logout()" size="small" text label="Logout" icon="pi pi-sign-out" severity="danger" />
                </div>
            </Popover>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import { useCommonStore } from '@/stores/common'
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

const commonStore = useCommonStore()
const { isDarkMode } = storeToRefs(commonStore)

const authStore = useAuthStore()

const op = ref();

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

const toggle = (event: MouseEvent) => {
    op.value.toggle(event);
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
