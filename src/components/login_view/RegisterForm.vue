<template>

    <h2 class="text-center mb-6 text-a font-bold text-2xl">Zarejestruj się</h2>

    <!-- Form -->
    <form @submit.prevent="onRegister" class="space-y-4 w-full">
        <div>
            <label for="email" class="block mb-1 text-b">Email</label>
            <InputText v-model="email" id="email" type="email" class="w-full" placeholder="example@example.com"
                required />
        </div>
        <div>
            <label for="password" class="block mb-1 text-b">Hasło</label>
            <InputText type="password" v-model="password" id="password" class="w-full" placeholder="••••••"
                required />
        </div>
        <div>
            <label for="password" class="block mb-1 text-b">Powtórz hasło</label>
            <InputText type="password" v-model="passwordRepeat" id="password" class="w-full" placeholder="••••••"
                required />
        </div>
        <div class="flex flex-col text-sm">
            <Button @click="onRegister()" label="Zarejestruj się" type="submit" class="w-full" />
        </div>
    </form>

    <!-- Social login -->
    <div class="my-6 flex items-center justify-center gap-4">
        <Button icon="pi pi-google" rounded outlined aria-label="Login with Google" class="p-button-lg" />
        <Button icon="pi pi-facebook" rounded outlined aria-label="Login with Facebook" class="p-button-lg" />
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const email = ref("");
const password = ref("");
const passwordRepeat = ref("")

const onRegister = async () => {
    try {
        await authStore.register(email.value, password.value);
        console.log("User Registered");
    } catch (e) {
        console.error("Failed to login", e);
    }
}
</script>

<style scoped>

</style>