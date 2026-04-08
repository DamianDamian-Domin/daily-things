<template>

    <!-- DIALOG: Forgot password -->
    <Dialog
        v-model:visible="showResetDialog"
        modal
        dismissableMask
        :closable="false"
        header="Reset password"
        class="w-[clamp(20rem,50%,28rem)]">
        <div class="flex flex-col gap-4">
            <!-- State: form -->
            <template v-if="!resetSent">
                <p class="text-c text-sm">
                    Enter the email address connected to your account. We will send you a password reset link.
                </p>
                <div>
                    <label for="resetEmail" class="block mb-1 text-b text-sm">Email</label>
                    <InputText
                        v-model="resetEmail"
                        id="resetEmail"
                        type="email"
                        class="w-full"
                        placeholder="example@example.com"
                        @keydown.enter.prevent="onResetPassword" />
                </div>
                <AuthErrorBanner :error="resetError" @dismiss="resetError = null" />
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" text severity="secondary" @click="showResetDialog = false" />
                    <Button
                        label="Send link"
                        icon="pi pi-send"
                        :disabled="!resetEmailValid"
                        @click="onResetPassword" />
                </div>
            </template>

            <!-- State: sent -->
            <template v-else>
                <div class="flex flex-col items-center text-center py-2">
                    <div class="flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                        <i class="pi pi-check text-2xl"></i>
                    </div>
                    <p class="text-b text-sm font-medium">Link sent!</p>
                    <p class="text-c text-xs mt-1">
                        Check your inbox at <span class="font-semibold">{{ resetEmail }}</span> and click the link to set a new password.
                    </p>
                </div>
                <Button label="OK" class="w-full" @click="closeResetDialog" />
            </template>
        </div>
    </Dialog>

    <h2 class="text-center mb-6 text-a font-lora text-2xl">Welcome back 👋</h2>

    <!-- Form -->
    <form @submit.prevent="onLogin" class="space-y-4 w-full">
        <div>
            <label for="email" class="block mb-1 text-b">Email</label>
            <InputText v-model="email" id="email" type="email" class="w-full" placeholder="example@example.com"
                required />
        </div>

        <div>
            <label for="password" class="block mb-1 text-b">Password</label>
            <InputText type="password" v-model="password" id="password" class="w-full" placeholder="••••••"
                required />
        </div>

        <div class="flex flex-col text-sm">
            <Button label="Sign in" type="submit" class="w-full" />
            <div class="flex justify-end">
                <Button label="Forgot password" link class="text-primary" @click="onForgotPassword" />
            </div>
        </div>

        <!-- Banner for unverified email -->
        <Transition name="verify-banner">
            <div v-if="error === '__email_not_verified__'" class="verify-banner">
                <div class="flex items-center gap-3">
                    <div class="verify-icon">
                        <i class="pi pi-envelope text-base"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold leading-snug">Email not verified</p>
                        <p class="text-xs opacity-80 mt-0.5">Check your inbox and click the verification link.</p>
                    </div>
                    <button type="button" class="verify-close" @click="error = null" aria-label="Close">
                        <i class="pi pi-times text-xs"></i>
                    </button>
                </div>
                <div class="flex justify-center mt-3">
                    <Button
                        type="button"
                        :label="resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend link'"
                        :disabled="resendCooldown > 0"
                        size="small"
                        outlined
                        icon="pi pi-refresh"
                        class="w-full text-xs"
                        @click="onResendVerification" />
                </div>
            </div>
        </Transition>

        <!-- Other errors -->
        <AuthErrorBanner v-if="error !== '__email_not_verified__'" :error="error" @dismiss="error = null" />
    </form>

    <!-- Social login -->
    <div class="my-6 flex items-center justify-center gap-4">
        <Button icon="pi pi-google" rounded outlined aria-label="Login with Google" class="p-button-lg" @click="onGoogleLogin" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";
import Dialog from "primevue/dialog";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const { error } = storeToRefs(authStore);

const email = ref("");
const password = ref("");



const onLogin = async () => {
    try {
        await authStore.login(email.value, password.value);
        console.log("Login");
        router.push("/")
    } catch (e) {
        console.error("Failed to login", e);
    }
}

// Password reset
const showResetDialog = ref(false);
const resetEmail = ref("");
const resetSent = ref(false);
const resetError = ref<string | null>(null);

const resetEmailValid = computed(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.value)
);

const onForgotPassword = () => {
    resetEmail.value = email.value; // Prefill email from the sign-in form
    resetSent.value = false;
    resetError.value = null;
    showResetDialog.value = true;
};

const onResetPassword = async () => {
    if (!resetEmailValid.value) return;
    resetError.value = null;
    try {
        await authStore.resetPassword(resetEmail.value);
        resetSent.value = true;
    } catch (e: any) {
        resetError.value = authStore.error;
    }
};

const closeResetDialog = () => {
    showResetDialog.value = false;
    resetSent.value = false;
    resetEmail.value = "";
    resetError.value = null;
};

// Resend verification email
const resendCooldown = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

const onResendVerification = async () => {
    if (resendCooldown.value > 0) return;
    try {
        await authStore.resendVerificationEmail(email.value, password.value);
        error.value = '__email_not_verified__';
        // Start 60s cooldown
        resendCooldown.value = 60;
        cooldownInterval = setInterval(() => {
            resendCooldown.value--;
            if (resendCooldown.value <= 0 && cooldownInterval) {
                clearInterval(cooldownInterval);
                cooldownInterval = null;
            }
        }, 1000);
    } catch (e) {
        console.error("Failed to resend verification email", e);
    }
};

// External provider login
const onGoogleLogin = async () => {
    try {
        await authStore.loginWithGoogle();
        router.push("/");
    } catch (e) {
        console.error("Failed to sign in with Google", e);
    }
};

</script>

<style scoped>
.verify-banner {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, var(--p-yellow-50), var(--p-orange-50));
    border: 1px solid var(--p-yellow-200);
    color: var(--p-yellow-800);
}
:where(.my-app-dark, .my-app-dark *) .verify-banner {
    background: linear-gradient(135deg, color-mix(in srgb, var(--p-yellow-900) 30%, transparent), color-mix(in srgb, var(--p-orange-900) 20%, transparent));
    border-color: var(--p-yellow-700);
    color: var(--p-yellow-200);
}
.verify-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    flex-shrink: 0;
    background: var(--p-yellow-100);
    color: var(--p-yellow-600);
}
:where(.my-app-dark, .my-app-dark *) .verify-icon {
    background: color-mix(in srgb, var(--p-yellow-700) 40%, transparent);
    color: var(--p-yellow-300);
}
.verify-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    flex-shrink: 0;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--p-yellow-500);
    transition: background-color 0.2s, color 0.2s;
}
.verify-close:hover {
    background: var(--p-yellow-200);
    color: var(--p-yellow-800);
}
:where(.my-app-dark, .my-app-dark *) .verify-close:hover {
    background: color-mix(in srgb, var(--p-yellow-700) 50%, transparent);
    color: var(--p-yellow-200);
}

.verify-banner-enter-active {
    animation: verify-slide-in 0.3s ease-out;
}
.verify-banner-leave-active {
    animation: verify-slide-out 0.2s ease-in forwards;
}
@keyframes verify-slide-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes verify-slide-out {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-6px); }
}
</style>