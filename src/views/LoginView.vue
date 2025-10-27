<template>
    <div class="min-h-screen flex items-center justify-center surface-ground relative overflow-hidden">
        <!-- Falling icons -->
        <div class="absolute inset-0  pointer-events-none overflow-hidden">
            <span v-for="(habit, index) in fallingHabits" :key="index"
                class="material-icons material-symbols-outlined falling-icon text-c" :style="{
                left: habit.left + '%',
                animationDuration: habit.duration + 's',
                animationDelay: habit.delay + 's',
                fontSize: habit.size + 'px',
                transform: `rotate(${habit.angle}deg)`
            }">
                {{ habit.icon }}
            </span>
        </div>

            <div class="card-a surface-content w-full max-w-md flex flex-col items-center relative z-10">
                <img :src="logo" alt="Logo" class="h-24 mb-4" />
                <LoginForm v-if="form == 'login'"></LoginForm>
                <RegisterForm v-if="form == 'register'"></RegisterForm>
                <!-- Register link -->
                <div class="text-center text-sm mb-4" v-if="form === 'login'">
                    <span class="text-b">Nie masz konta? </span>
                    <Button label="Załóż konto" link class="text-primary" @click="openRegisterForm" />
                </div>
                <div class="text-center text-sm mb-4" v-if="form === 'register'">
                    <span class="text-b">Masz już konto? </span>
                    <Button label="Zaloguj się" link class="text-primary" @click="openLoginForm" />
                </div>

                <!-- Footer -->
                <p class="text-xs text-c text-center">© Daily Things 2025</p>
            </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "primevue/button";
import logoFile from "@/assets/logo.png";
import { useHabbitsStore } from "@/stores/habbits";
import { storeToRefs } from "pinia";

import LoginForm from "@/components/login_view/LoginForm.vue";
import RegisterForm from "@/components/login_view/RegisterForm.vue";

const habbitsStore = useHabbitsStore();
const { allHabbitsList } = storeToRefs(habbitsStore);
const logo = logoFile;

const form = ref('login')

const openRegisterForm = () => form.value = 'register';
const openLoginForm = () => form.value = 'login';

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