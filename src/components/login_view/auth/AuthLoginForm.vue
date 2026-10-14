<template>
	<form
		class="auth-section"
		novalidate
		@submit.prevent="onLogin">
		<h2
			:id="titleId"
			class="auth-title">
			Welcome back 👋
		</h2>
		<p
			v-if="authStore.isGuest"
			class="auth-lead">
			Your guest progress will be moved to this account.
		</p>

		<div class="dt-field">
			<label
				for="auth-email"
				class="dt-label"
				>Email</label
			>
			<input
				id="auth-email"
				v-model="email"
				type="email"
				class="dt-input"
				autocomplete="email"
				inputmode="email"
				required
				placeholder="you@example.com" />
		</div>
		<div class="dt-field">
			<div class="auth-label-row">
				<label
					for="auth-password"
					class="dt-label"
					>Password</label
				>
				<button
					type="button"
					class="dt-link auth-small-link"
					@click="emit('switch-mode', 'reset')">
					Forgot password?
				</button>
			</div>
			<PasswordInput
				id="auth-password"
				v-model="password"
				autocomplete="current-password" />
		</div>

		<AuthErrorBanner
			:error="authStore.error"
			@dismiss="authStore.error = null" />

		<button
			type="submit"
			class="dt-btn dt-btn-primary dt-btn-block"
			:disabled="authStore.busy || !email || !password">
			<i
				v-if="authStore.busy"
				class="pi pi-spin pi-spinner"
				aria-hidden="true"></i>
			Sign in
		</button>

		<button
			v-if="authStore.canUseGoogle"
			type="button"
			class="dt-btn dt-btn-outline dt-btn-block"
			:disabled="authStore.busy"
			@click="onGoogle">
			<i
				class="pi pi-google"
				aria-hidden="true"></i>
			Sign in with Google
		</button>

		<p class="auth-switch">
			New here?
			<button
				type="button"
				class="dt-link"
				@click="emit('switch-mode', 'register')">
				Create an account
			</button>
		</p>
	</form>
</template>

<script setup lang="ts">
import { useAuthStore, type AuthDialogMode } from "@/stores/auth";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";
import PasswordInput from "@/components/login_view/PasswordInput.vue";

defineProps<{ titleId: string }>();
const emit = defineEmits<{ (e: "switch-mode", mode: AuthDialogMode): void }>();

// Email i hasło trzyma AuthDialog, żeby przetrwały zmianę trybu
const email = defineModel<string>("email", { required: true });
const password = defineModel<string>("password", { required: true });

const authStore = useAuthStore();

async function onLogin() {
	try {
		await authStore.login(email.value, password.value);
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}

async function onGoogle() {
	try {
		await authStore.loginWithGoogle();
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}
</script>

<style scoped>
.auth-label-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}
.auth-small-link {
	font-size: var(--dt-text-sm);
}
</style>
