<template>
    <div class="w-full flex flex-row justify-between items-center">
        <div class="flex flex-row items-center gap-2">
            <img class="w-20" src="@/assets/logo.png" alt="">
            <h1 class="font-sacramento text-3xl">Daily Things</h1>
        </div>
        <div class="flex flex-row items-center gap-2">
            <!-- Dark mode toggle — ciepły styl -->
            <button class="theme-toggle" @click="toggleDarkMode()">
                <i :class="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>

            <!-- Avatar -->
            <div class="avatar-btn" @click="toggle">
                <img v-if="userPhotoUrl" :src="userPhotoUrl" alt="Avatar" class="avatar-img" referrerpolicy="no-referrer" />
                <span v-else class="avatar-initials">{{ userInitials }}</span>
            </div>

            <Popover ref="op">
                <div class="popover-menu">
                    <!-- Powitanie -->
                    <div class="popover-header">
                        <div class="popover-avatar">
                            <img v-if="userPhotoUrl" :src="userPhotoUrl" alt="Avatar" class="popover-avatar-img" referrerpolicy="no-referrer" />
                            <span v-else class="popover-avatar-initials">{{ userInitials }}</span>
                        </div>
                        <div class="popover-user-info">
                            <p class="popover-greeting">{{ greeting }} 👋</p>
                            <p class="popover-user-name">{{ userDisplayName }}</p>
                            <p class="popover-user-email">{{ userEmail }}</p>
                        </div>
                    </div>

                    <div class="popover-divider"></div>

                    <!-- Opcje menu -->
                    <button class="popover-item" @click="onProfile">
                        <i class="pi pi-user popover-item-icon"></i>
                        <span>Mój profil</span>
                    </button>
                    <button class="popover-item" @click="onSettings">
                        <i class="pi pi-cog popover-item-icon"></i>
                        <span>Ustawienia</span>
                    </button>

                    <div class="popover-divider"></div>

                    <button class="popover-item popover-item-logout" @click="logOut()">
                        <i class="pi pi-sign-out popover-item-icon"></i>
                        <span>Wyloguj się</span>
                    </button>
                </div>
            </Popover>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Popover from 'primevue/popover';
import { useCommonStore } from '@/stores/common'
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useHabbitsStore } from '@/stores/habbits';

const commonStore = useCommonStore()
const { isDarkMode } = storeToRefs(commonStore)

const habbitsStore = useHabbitsStore()
const { dailyGoalsList, userHabbitsList } = storeToRefs(habbitsStore)

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const op = ref();

// Dane użytkownika z Firebase Auth
const userEmail = computed(() => user.value?.email ?? '');
const userDisplayName = computed(() => user.value?.displayName ?? userEmail.value.split('@')[0] ?? '');
const userPhotoUrl = computed(() => user.value?.photoURL ?? '');

// Inicjały — z displayName lub z emaila
const userInitials = computed(() => {
    const name = user.value?.displayName;
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    const email = user.value?.email ?? '';
    const local = email.split('@')[0] ?? '';
    return local.substring(0, 2).toUpperCase() || '?';
});

// Powitanie zależne od pory dnia
const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Dobrej nocy';
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Cześć';
    return 'Dobry wieczór';
});

const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    if (isDarkMode.value) {
        document.documentElement.classList.add('my-app-dark')
        localStorage.setItem('theme', 'dark')
    } else {
        document.documentElement.classList.remove('my-app-dark')
        localStorage.setItem('theme', 'light')
    }
}

const toggle = (event: MouseEvent) => {
    op.value.toggle(event);
}

const onProfile = () => {
    op.value.hide();
};

const onSettings = () => {
    op.value.hide();
};

const logOut = () => {
    op.value.hide();
    authStore.logout()
    dailyGoalsList.value = []
    userHabbitsList.value = []
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
        isDarkMode.value = savedTheme === 'dark'
    } else {
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    if (isDarkMode.value) {
        document.documentElement.classList.add('my-app-dark')
    }
})

</script>

<style scoped>
/* Toggle dark mode — ciepły, zaokrąglony przycisk */
.theme-toggle {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    background: var(--p-orange-50);
    color: var(--p-orange-500);
    transition: background-color 0.25s, color 0.25s, transform 0.2s;
}
:where(.my-app-dark, .my-app-dark *) .theme-toggle {
    background: color-mix(in srgb, var(--p-yellow-900) 30%, transparent);
    color: var(--p-yellow-400);
}
.theme-toggle:hover {
    background: var(--p-orange-100);
    transform: rotate(15deg) scale(1.08);
}
:where(.my-app-dark, .my-app-dark *) .theme-toggle:hover {
    background: color-mix(in srgb, var(--p-yellow-800) 40%, transparent);
}

/* Avatar przycisk w navbar */
.avatar-btn {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: box-shadow 0.25s, transform 0.2s;
    background: linear-gradient(145deg, var(--p-orange-300), var(--p-pink-300));
    box-shadow: 0 2px 8px color-mix(in srgb, var(--p-orange-300) 30%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .avatar-btn {
    background: linear-gradient(145deg, var(--p-orange-700), var(--p-pink-700));
    box-shadow: 0 2px 8px color-mix(in srgb, var(--p-orange-900) 40%, transparent);
}
.avatar-btn:hover {
    transform: scale(1.07);
    box-shadow: 0 3px 12px color-mix(in srgb, var(--p-orange-400) 35%, transparent);
}
.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.avatar-initials {
    font-family: 'Lora', serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    letter-spacing: 0.04em;
    user-select: none;
}

/* ====== Popover menu ====== */
.popover-menu {
    width: 15rem;
    padding: 0.35rem 0;
}

/* Nagłówek z powitaniem */
.popover-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem 0.5rem;
}
.popover-avatar {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.75rem;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--p-orange-300), var(--p-pink-300));
}
:where(.my-app-dark, .my-app-dark *) .popover-avatar {
    background: linear-gradient(145deg, var(--p-orange-700), var(--p-pink-700));
}
.popover-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.popover-avatar-initials {
    font-family: 'Lora', serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
}
.popover-user-info {
    min-width: 0;
}
.popover-greeting {
    font-family: 'Lora', serif;
    font-size: 0.7rem;
    font-style: italic;
    color: var(--p-orange-500);
    margin-bottom: 0.1rem;
}
:where(.my-app-dark, .my-app-dark *) .popover-greeting {
    color: var(--p-orange-400);
}
.popover-user-name {
    font-family: 'Lora', serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--p-gray-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
:where(.my-app-dark, .my-app-dark *) .popover-user-name {
    color: var(--p-gray-100);
}
.popover-user-email {
    font-size: 0.7rem;
    color: var(--p-gray-400);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
:where(.my-app-dark, .my-app-dark *) .popover-user-email {
    color: var(--p-gray-500);
}

/* Divider */
.popover-divider {
    height: 1px;
    margin: 0.35rem 0.85rem;
    background: var(--p-orange-100);
}
:where(.my-app-dark, .my-app-dark *) .popover-divider {
    background: var(--p-gray-700);
}

/* Elementy menu */
.popover-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.55rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'Lora', serif;
    font-size: 0.85rem;
    color: var(--p-gray-600);
    transition: background-color 0.2s, color 0.2s, padding-left 0.2s;
    text-align: left;
    border-radius: 0;
}
:where(.my-app-dark, .my-app-dark *) .popover-item {
    color: var(--p-gray-300);
}
.popover-item:hover {
    background: var(--p-orange-50);
    color: var(--p-orange-700);
    padding-left: 1.2rem;
}
:where(.my-app-dark, .my-app-dark *) .popover-item:hover {
    background: color-mix(in srgb, var(--p-orange-900) 25%, transparent);
    color: var(--p-orange-300);
}
.popover-item-icon {
    font-size: 0.95rem;
    width: 1.15rem;
    text-align: center;
    opacity: 0.65;
}

/* Logout — delikatne wyróżnienie, nie agresywny czerwony */
.popover-item-logout {
    color: var(--p-gray-400);
}
:where(.my-app-dark, .my-app-dark *) .popover-item-logout {
    color: var(--p-gray-500);
}
.popover-item-logout:hover {
    background: var(--p-red-50);
    color: var(--p-red-500);
    padding-left: 1.2rem;
}
:where(.my-app-dark, .my-app-dark *) .popover-item-logout:hover {
    background: color-mix(in srgb, var(--p-red-900) 20%, transparent);
    color: var(--p-red-400);
}
</style>
