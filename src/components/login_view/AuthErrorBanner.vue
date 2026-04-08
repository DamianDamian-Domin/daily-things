<template>
    <Transition name="error-banner">
        <div v-if="error" class="error-banner" :class="{ 'shake': shouldShake }">
            <div class="flex items-center gap-3">
                <div class="error-icon-wrapper">
                    <i class="pi pi-exclamation-triangle text-sm"></i>
                </div>
                <span class="flex-1 text-sm font-medium leading-snug">{{ error }}</span>
                <button
                    type="button"
                    class="error-close-btn"
                    @click="dismiss"
                    aria-label="Zamknij">
                    <i class="pi pi-times text-xs"></i>
                </button>
            </div>
            <!-- Pasek postępu auto-dismiss -->
            <div class="error-progress-track">
                <div
                    class="error-progress-bar"
                    :style="{ animationDuration: autoDismissMs + 'ms' }"
                    :key="animationKey" />
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";

const props = withDefaults(defineProps<{
    error: string | null;
    autoDismissMs?: number;
}>(), {
    autoDismissMs: 6000,
});

const emit = defineEmits<{
    (e: "dismiss"): void;
}>();

const shouldShake = ref(false);
const animationKey = ref(0);
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

// Reaguj na nowe błędy — uruchom shake i auto-dismiss timer
watch(
    () => props.error,
    (newError) => {
        clearTimer();

        if (newError) {
            // Uruchom animację shake
            shouldShake.value = false;
            void document.body.offsetWidth; // force reflow
            shouldShake.value = true;
            animationKey.value++;

            // Auto-dismiss po upływie czasu
            dismissTimer = setTimeout(() => {
                emit("dismiss");
            }, props.autoDismissMs);
        }
    }
);

function dismiss() {
    clearTimer();
    emit("dismiss");
}

function clearTimer() {
    if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
    }
}
</script>

<style scoped>
.error-banner {
    position: relative;
    overflow: hidden;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-top: 0.75rem;
    background: linear-gradient(135deg, var(--p-red-50), var(--p-red-100));
    border: 1px solid var(--p-red-200);
    color: var(--p-red-700);
}

:where(.my-app-dark, .my-app-dark *) .error-banner {
    background: linear-gradient(135deg, color-mix(in srgb, var(--p-red-900) 40%, transparent), color-mix(in srgb, var(--p-red-800) 30%, transparent));
    border-color: var(--p-red-700);
    color: var(--p-red-200);
}

.error-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    flex-shrink: 0;
    background: var(--p-red-100);
    color: var(--p-red-600);
}

:where(.my-app-dark, .my-app-dark *) .error-icon-wrapper {
    background: color-mix(in srgb, var(--p-red-700) 50%, transparent);
    color: var(--p-red-300);
}

.error-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    flex-shrink: 0;
    transition: color 0.2s, background-color 0.2s;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--p-red-400);
}
.error-close-btn:hover {
    background: var(--p-red-200);
    color: var(--p-red-700);
}
:where(.my-app-dark, .my-app-dark *) .error-close-btn:hover {
    background: color-mix(in srgb, var(--p-red-700) 50%, transparent);
    color: var(--p-red-200);
}

/* Pasek postępu - odlicza czas do auto-dismiss */
.error-progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--p-red-200);
}
:where(.my-app-dark, .my-app-dark *) .error-progress-track {
    background: color-mix(in srgb, var(--p-red-700) 40%, transparent);
}

.error-progress-bar {
    height: 100%;
    background: var(--p-red-500);
    animation: shrink-progress linear forwards;
}

@keyframes shrink-progress {
    from { width: 100%; }
    to   { width: 0%; }
}

/* Shake na pojawienie się nowego błędu */
.shake {
    animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
    10%, 90%  { transform: translateX(-1px); }
    20%, 80%  { transform: translateX(2px);  }
    30%, 50%, 70% { transform: translateX(-3px); }
    40%, 60%  { transform: translateX(3px);  }
}

/* Transition enter / leave */
.error-banner-enter-active {
    animation: slide-in 0.3s ease-out;
}
.error-banner-leave-active {
    animation: slide-out 0.25s ease-in forwards;
}
@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateY(-8px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
@keyframes slide-out {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(-8px) scale(0.97);
    }
}
</style>
