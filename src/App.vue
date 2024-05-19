
<template>
  <div class="flex flex-col gap-4 w-screen h-screen bg-ground px-4 py-2">
    <NavBar></NavBar>
    <Divider class="w-4/5 self-center"></Divider>
    <RouterView />
  </div>
</template>


<script setup>
import NavBar from '@/components/NavBar.vue'
import Divider from 'primevue/divider';


</script>
