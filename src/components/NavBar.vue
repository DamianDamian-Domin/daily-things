<template>
    <div class="w-full flex flex-row justify-between">
        <div class="flex flex-row items-center gap-2">
            <img class="w-24" src="@/assets/logo.png" alt="">
            <h1> Daily Things </h1>

        </div>
        <div class="flex flex-row items-center gap-2">
            <Avatar shape="circle" icon="pi pi-ellipsis-v" size="large" class="surface-secondary text-white" />
            <Avatar shape="circle" label="DD" size="large" class="surface-primary text-a" />
        </div>
    </div>
</template>

<script setup>
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';

</script>

