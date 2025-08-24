<template>
    <div class="min-h-screen flex items-center justify-center surface-ground relative overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 -z-10">
        <div class="w-full h-full bg-gradient-to-br from-primary-200/40 to-primary-400/20 dark:from-primary-700/30 dark:to-primary-500/10 animate-pulse"></div>
        <div class="absolute top-10 left-10 w-40 h-40 bg-primary-200/30 dark:bg-primary-700/30 rounded-full blur-3xl animate-ping"></div>
        <div class="absolute bottom-10 right-10 w-56 h-56 bg-primary-300/30 dark:bg-primary-600/30 rounded-full blur-3xl animate-ping delay-200"></div>
      </div>
  
      <!-- Card -->
      <div class="card-a surface-content w-full max-w-md flex flex-col items-center">

        <!-- Logo -->
        <img :src="logo" alt="Logo" class="h-24 mb-4" />
  
        <h2 class="text-center mb-6 text-a font-bold text-2xl">Sign In</h2>
  
        <!-- Form -->
        <form @submit.prevent="onLogin" class="space-y-4 w-full">
          <div>
            <label for="email" class="block mb-1 text-b">Email</label>
            <InputText v-model="email" id="email" type="email" class="w-full" placeholder="example@example.com" required />
          </div>
  
          <div class="w-full">
            <label for="password" class="block mb-1 text-b">Password</label>
            <InputText type="password" v-model="password" id="password" toggleMask feedback="false" class="w-full" placeholder="••••••" required />
          </div>
  
          <div class="flex flex-col  text-sm">
            <Button label="Sign In" type="submit" class="w-full" />
            <div class="flex justify-end">
              <Button label="Forgot Password" link class="text-primary" @click="onForgotPassword" />
            </div>
          </div>

        </form>
  
        <!-- Social login -->
        <div class="my-6 flex items-center justify-center gap-4">
          <Button icon="pi pi-google" rounded outlined aria-label="Login with Google" class="p-button-lg" />
          <Button icon="pi pi-facebook" rounded outlined aria-label="Login with Facebook" class="p-button-lg" />
        </div>
  
        <!-- Register link -->
        <div class="text-center text-sm">
          <span class="text-b">No account? </span>
          <Button label="Sign Up" link class="text-primary" @click="onRegister" />
        </div>
        <div class="text-center text-sm">
          <span class="text-b">No account? </span>
          <Button label="Sign Up" link class="text-primary" @click="onRegister" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import InputText from "primevue/inputtext";
  import Password from "primevue/password";
  import Button from "primevue/button";
  
  import logoFile from "@/assets/logo.png";
  
  const logo = logoFile;
  
  const email = ref("");
  const password = ref("");
  
  const onLogin = () => {
    console.log("Login with:", email.value, password.value);
  };
  
  const onForgotPassword = () => {
    console.log("Forgot password clicked");
  };
  
  const onRegister = () => {
    console.log("Register clicked");
  };
  </script>
  
  <style scoped>
  </style>
  