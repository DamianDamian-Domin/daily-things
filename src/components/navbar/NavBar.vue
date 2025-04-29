<template>
    <div class="w-full flex flex-row justify-between">
        <div class="flex flex-row items-center gap-2">
            <img class="w-20" src="@/assets/logo.png" alt="">
            <h1> Daily Things </h1>

        </div>
        <div class="flex flex-row items-center gap-2">
            <Avatar shape="circle" icon="pi pi-ellipsis-v" size="large" class="surface-secondary" />
            <Avatar shape="circle" label="DD" size="large" class="surface-primary " />
            <Button severity="secondary" label="Dark" @click="toggleDarkMode()" />
        </div>
    </div>
</template>

<script setup>
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';


function toggleDarkMode() {
    document.documentElement.classList.toggle('my-app-dark');
}

</script>

