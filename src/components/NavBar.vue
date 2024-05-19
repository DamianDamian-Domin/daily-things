<template>
    <div class="w-full flex flex-row justify-between">
        <div class="flex flex-row items-center gap-2">
            <img src="@/assets/logo.png" alt="">
            <h2 class=" text-3xl text-black-100t"> Daily Things </h2>

        </div>
        <div class="flex flex-row items-center gap-2">
            <Avatar shape="circle" label="DD" size="large" class="bg-green text-white-100" />
            <Avatar shape="circle" icon="pi pi-ellipsis-v" size="large" class="bg-gray-500 text-gray-100" />

        </div>
    </div>
</template>

<script setup>
import Avatar from 'primevue/avatar';

</script>

