<template>
    <div class="min-h-screen flex items-center justify-center surface-ground relative overflow-hidden">
      <!-- Falling icons -->
      <div class="absolute inset-0  pointer-events-none overflow-hidden">
        <span
          v-for="(habit, index) in fallingHabits"
          :key="index"
          class="material-icons material-symbols-outlined falling-icon text-c"
          :style="{
            left: habit.left + '%',
            animationDuration: habit.duration + 's',
            animationDelay: habit.delay + 's',
            fontSize: habit.size + 'px',
            transform: `rotate(${habit.angle}deg)`
          }"
        >
          {{ habit.icon }}
        </span>
      </div>
  
      <!-- Card -->
      <div class="card-a surface-content w-full max-w-md flex flex-col items-center relative z-10">
        <!-- Logo -->
        <img :src="logo" alt="Logo" class="h-24 mb-4" />
  
        <h2 class="text-center mb-6 text-a font-bold text-2xl">Zaloguj się</h2>
  
        <!-- Form -->
        <form @submit.prevent="onLogin" class="space-y-4 w-full">
          <div>
            <label for="email" class="block mb-1 text-b">Email</label>
            <InputText v-model="email" id="email" type="email" class="w-full" placeholder="example@example.com" required />
          </div>
  
          <div>
            <label for="password" class="block mb-1 text-b">Hasło</label>
            <InputText type="password" v-model="password" id="password" class="w-full" placeholder="••••••" required />
          </div>
  
          <div class="flex flex-col text-sm">
            <Button label="Zaloguj się" type="submit" class="w-full" />
            <div class="flex justify-end">
              <Button label="Przypomnij hasło" link class="text-primary" @click="onForgotPassword" />
            </div>
          </div>
        </form>
  
        <!-- Social login -->
        <div class="my-6 flex items-center justify-center gap-4">
          <Button icon="pi pi-google" rounded outlined aria-label="Login with Google" class="p-button-lg" />
          <Button icon="pi pi-facebook" rounded outlined aria-label="Login with Facebook" class="p-button-lg" />
        </div>
  
        <!-- Register link -->
        <div class="text-center text-sm mb-4">
          <span class="text-b">Nie masz konta? </span>
          <Button label="Załóż konto" link class="text-primary" @click="onRegister" />
        </div>
  
        <!-- Footer -->
        <p class="text-xs text-c text-center">© Daily Things 2025</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import InputText from "primevue/inputtext";
  import Button from "primevue/button";
  import logoFile from "@/assets/logo.png";
  import { useHabbitsStore } from "@/stores/habbits";
  import { storeToRefs } from "pinia";
  

  const habbitsStore = useHabbitsStore();
  const { allHabbitsList } = storeToRefs(habbitsStore);
  const logo = logoFile;
  
  const email = ref("");
  const password = ref("");
  
  const onLogin = () => console.log("Login with:", email.value, password.value);
  const onForgotPassword = () => console.log("Forgot password clicked");
  const onRegister = () => console.log("Register clicked");
  
  function getRandomHabbits(count: number) {
    const shuffled = [...allHabbitsList.value].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  const fallingHabits = getRandomHabbits(8).map((h) => ({
    icon: h.icon,
    left: Math.random() * 100, // pozycja startowa w %
    duration: 5 + Math.random() * 6, // czas spadania
    delay: Math.random() * 5, // opóźnienie
    size: 20 + Math.random() * 30, // rozmiar px
    angle: -30 + Math.random() * 60, // kąt
  }));
  </script>
  
  <style scoped>
  @keyframes fall {
    0% {
      transform: translateY(-100%) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    100% {
      transform: translateY(120vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  .falling-icon {
    position: absolute;
    top: -50px;
    animation-name: fall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  </style>
  