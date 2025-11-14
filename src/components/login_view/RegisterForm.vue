<template>

    <!-- SUCCESS DIALOG -->
    <Dialog v-model:visible="visible" modal :show-header="false" :style="{ width: '24rem', maxWidth: '90vw' }" :pt="{
        root: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-500 relative overflow-hidden',
        mask: 'backdrop-blur-sm'
    }" @show="startConfetti">
        <!-- CONFETTI LAYER -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <span v-for="n in 35" :key="n" class="confetti"></span>
        </div>

        <div class="flex flex-col items-center text-center animate-[fadeIn_0.4s_ease-out] relative z-10 pt-6">
            <div
                class="surface-success rounded-full w-16 h-16 md:w-16 md:h-16 flex items-center justify-center shadow-md animate-[popIn_0.35s_ease-out]">
                <i class="pi pi-check text-2xl text-contrast"></i>
            </div>

            <h2 class="mt-4 text-success text-xl md:text-2xl">
                Success!
            </h2>

            <p class="text-b mt-2 text-sm md:text-base">
                Your account has been created successfully.<br />
                You can now log in.
            </p>

            <Button label="Close" class="mt-6 w-full surface-success text-contrast rounded-md py-2"
                @click="visible = false" />
        </div>
    </Dialog>


    <!-- TITLE -->
    <h2 class="text-center mb-6 text-a font-bold text-2xl">Zarejestruj się</h2>


    <!-- FORM -->
    <form @submit.prevent="onRegister" class="space-y-4 w-full">

        <!-- Email -->
        <div>
            <label for="email" class="block mb-1 text-b">Email</label>

            <InputText v-model="email" id="email" type="email" class="w-full"
                :class="(!emailValid && touchedEmail) ? 'border-red-500' : ''" placeholder="example@example.com"
                required />

            <p v-if="touchedEmail && debouncedEmail && !emailValid" class="text-danger text-sm mt-1">
                Enter a valid email address.
            </p>
        </div>

        <!-- Password -->
        <div>
            <label for="password" class="block mb-1 text-b">Password</label>

            <InputText type="password" v-model="password" id="password" class="w-full"
                :class="(!passwordValid && touchedPassword) ? 'border-red-500' : ''" placeholder="••••••" required />

            <p v-if="touchedPassword && debouncedPassword && !passwordValid"
                class="text-danger text-sm mt-1 leading-tight">
                Password must contain:
                <br>• at least 8 characters
                <br>• one uppercase letter
                <br>• one lowercase letter
                <br>• one number
            </p>
        </div>

        <!-- Repeat Password -->
        <div>
            <label for="passwordRepeat" class="block mb-1 text-b">Repeat Password</label>

            <InputText type="password" v-model="passwordRepeat" id="passwordRepeat" class="w-full"
                :class="(!passwordsMatch && touchedPasswordRepeat) ? 'border-red-500' : ''" placeholder="••••••"
                required />

            <p v-if="touchedPasswordRepeat && debouncedPasswordRepeat && !passwordsMatch"
                class="text-danger text-sm mt-1">
                Passwords do not match.
            </p>
        </div>

        <!-- Button -->
        <div class="flex flex-col text-sm">
            <Button label="Sign Up" type="submit" class="w-full" :disabled="!formValid" />
            <p v-if="error" class="text-danger text-sm mt-2">
                {{ error }}
            </p>
        </div>
    </form>


    <!-- SOCIAL LOGIN -->
    <div class="my-6 flex items-center justify-center gap-4">
        <Button icon="pi pi-google" rounded outlined aria-label="Login with Google" class="p-button-lg" />
        <Button icon="pi pi-facebook" rounded outlined aria-label="Login with Facebook" class="p-button-lg" />
    </div>

</template>



<script setup lang="ts">
import { ref, computed, watch } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";


/* --------------------------
   STORES
--------------------------- */
const authStore = useAuthStore();
const { error } = storeToRefs(authStore);


/* --------------------------
   FORM DATA
--------------------------- */
const email = ref("");
const password = ref("");
const passwordRepeat = ref("");

const visible = ref(false);


/* --------------------------
   DEBOUNCE
--------------------------- */
const debounce = (fn: Function, delay = 500) => {
    let timeout: any;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};


/* Debounced values */
const debouncedEmail = ref("");
const debouncedPassword = ref("");
const debouncedPasswordRepeat = ref("");

/* Dirty flags */
const touchedEmail = ref(false);
const touchedPassword = ref(false);
const touchedPasswordRepeat = ref(false);


/* --------------------------
   WATCHERS WITH DEBOUNCE
--------------------------- */
watch(
    email,
    debounce((v: string) => {
        debouncedEmail.value = v;
        touchedEmail.value = true;
    }, 500)
);

watch(
    password,
    debounce((v: string) => {
        debouncedPassword.value = v;
        touchedPassword.value = true;
    }, 500)
);

watch(
    passwordRepeat,
    debounce((v: string) => {
        debouncedPasswordRepeat.value = v;
        touchedPasswordRepeat.value = true;
    }, 500)
);


/* --------------------------
   VALIDATION RULES
--------------------------- */
const emailValid = computed(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail.value)
);

const passwordValid = computed(() =>
    /[A-Z]/.test(debouncedPassword.value) &&
    /[a-z]/.test(debouncedPassword.value) &&
    /\d/.test(debouncedPassword.value) &&
    debouncedPassword.value.length >= 8
);

const passwordsMatch = computed(() =>
    debouncedPassword.value === debouncedPasswordRepeat.value
);

const formValid = computed(() =>
    emailValid.value &&
    passwordValid.value &&
    passwordsMatch.value
);


/* --------------------------
   REGISTER HANDLER
--------------------------- */
const onRegister = async () => {
    if (!formValid.value) return;

    try {
        await authStore.register(email.value, password.value);
        visible.value = true;
    } catch (e) {
        console.error("Failed to register", e);
    }
};


/* --------------------------
   CONFETTI
--------------------------- */
const startConfetti = () => {
    const pieces = document.querySelectorAll(".confetti");
    pieces.forEach((el: any) => {
        el.classList.remove("animate-confetti");
        void el.offsetWidth;
        el.classList.add("animate-confetti");
    });
};

</script>



<style scoped>
/* fade + pop animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes popIn {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    80% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}


/* Confetti fall (dynamic) */
@keyframes confettiDynamic {
    0% {
        transform: translateY(-20px) translateX(0) rotate(0deg);
        opacity: 1;
    }

    100% {
        transform: translateY(240px) translateX(var(--shift-x)) rotate(var(--rotate));
        opacity: 0;
    }
}

.confetti {
    position: absolute;
    top: -10px;
    left: var(--start-x);
    width: var(--size-w);
    height: var(--size-h);
    background: var(--color);
    border-radius: 2px;
    opacity: 0;
}

.animate-confetti {
    animation: confettiDynamic var(--speed) ease-out forwards;
}

.confetti:nth-child(n) {
    --start-x: calc(5% + (90% * (var(--i))));
    --shift-x: calc(-40px + 80px * var(--i));
    --rotate: calc(200deg + 360deg * var(--i));
}

/* MOBILE ADJUSTMENTS */
@media (max-width: 480px) {
    .confetti {
        width: calc(var(--size-w) * 0.7);
        height: calc(var(--size-h) * 0.7);
    }

    @keyframes confettiDynamic {
        0% {
            transform: translateY(-15px) translateX(0) rotate(0deg);
            opacity: 1;
        }

        100% {
            transform: translateY(180px) translateX(calc(var(--shift-x) * 0.8)) rotate(var(--rotate));
            opacity: 0;
        }
    }
}

/* dynamic confetti variations */
.confetti:nth-child(1n) {
    --i: .02;
    --speed: 1s;
    --size-w: 6px;
    --size-h: 12px;
    --color: var(--p-green-400);
}

.confetti:nth-child(2n) {
    --i: .2;
    --speed: 1.4s;
    --size-w: 7px;
    --size-h: 14px;
    --color: var(--p-yellow-400);
}

.confetti:nth-child(3n) {
    --i: .35;
    --speed: 1.1s;
    --size-w: 5px;
    --size-h: 10px;
    --color: var(--p-blue-400);
}

.confetti:nth-child(4n) {
    --i: .55;
    --speed: 1.5s;
    --size-w: 8px;
    --size-h: 16px;
    --color: var(--p-green-500);
}

.confetti:nth-child(5n) {
    --i: .75;
    --speed: 1.25s;
    --size-w: 10px;
    --size-h: 18px;
    --color: var(--p-orange-400);
}

.confetti:nth-child(6n) {
    --i: .9;
    --speed: 1.6s;
    --size-w: 6px;
    --size-h: 12px;
    --color: var(--p-yellow-500);
}
</style>