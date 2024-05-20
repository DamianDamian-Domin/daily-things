
<template>
  <div class="flex flex-col gap-1 w-screen h-screen surface-ground px-4 py-2 overflow-auto">
    <NavBar></NavBar>
    <Divider class="w-3/4 self-center"></Divider>
    <RouterView />
  </div>
</template>


<script setup>
import NavBar from '@/components/navbar/NavBar.vue'
import Divider from 'primevue/divider';


</script>
