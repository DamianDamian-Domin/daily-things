<template>
	<section
		v-if="resetSent"
		class="auth-section auth-success">
		<div
			class="auth-success-badge"
			aria-hidden="true">
			📬
		</div>
		<h2
			:id="titleId"
			class="auth-title">
			Check your inbox
		</h2>
		<p class="auth-lead">
			If an account exists for <strong>{{ email }}</strong>, you'll get a link to set
			a new password in a minute. Don't forget the spam folder.
		</p>
		<button
			type="button"
			class="dt-btn dt-btn-primary dt-btn-block"
			@click="emit('switch-mode', 'login')">
			Back to sign in
		</button>
	</section>
	<form
		v-else
		class="auth-section"
		novalidate
		@submit.prevent="onReset">
		<h2
			:id="titleId"
			class="auth-title">
			Reset your password
		</h2>
		<p class="auth-lead">
			Enter the email you signed up with and we'll send you a reset link.
		</p>
		<div class="dt-field">
			<label
				for="reset-email"
				class="dt-label"
				>Email</label
			>
			<input
				id="reset-email"
				v-model="email"
				type="email"
				class="dt-input"
				autocomplete="email"
				inputmode="email"
				required
				placeholder="you@example.com" />
		</div>
		<AuthErrorBanner
			:error="authStore.error"
			@dismiss="authStore.error = null" />
		<button
			type="submit"
			class="dt-btn dt-btn-primary dt-btn-block"
			:disabled="authStore.busy || !emailValid">
			<i
				:class="authStore.busy ? 'pi pi-spin pi-spinner' : 'pi pi-send'"
				aria-hidden="true"></i>
			Send reset link
		</button>
	</form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore, type AuthDialogMode } from "@/stores/auth";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";
import { isValidEmail } from "./validation";

defineProps<{ titleId: string }>();
const emit = defineEmits<{ (e: "switch-mode", mode: AuthDialogMode): void }>();

// Email i flagę „wysłano” trzyma AuthDialog (zerowane przy otwarciu i zmianie trybu)
const email = defineModel<string>("email", { required: true });
const resetSent = defineModel<boolean>("resetSent", { required: true });

const authStore = useAuthStore();

const emailValid = computed(() => isValidEmail(email.value));

async function onReset() {
	if (!emailValid.value) return;
	try {
		await authStore.resetPassword(email.value);
		resetSent.value = true;
	} catch (err) {
		// Nie zdradzamy, czy konto istnieje
		if ((err as { code?: string })?.code === "auth/user-not-found") {
			authStore.error = null;
			resetSent.value = true;
		}
	}
}
</script>
