<template>
	<section
		v-if="registered"
		class="auth-section auth-success">
		<div
			class="auth-success-badge"
			aria-hidden="true">
			🌿
		</div>
		<h2
			:id="titleId"
			class="auth-title">
			{{ m.allSet }}
		</h2>
		<p class="auth-lead">
			{{ m.verificationSentPrefix }} <strong>{{ email }}</strong>{{ m.verificationSentSuffix }}
		</p>
		<button
			type="button"
			class="dt-btn dt-btn-primary dt-btn-block"
			@click="authStore.closeAuthDialog()">
			{{ m.letsGo }}
		</button>
	</section>

	<form
		v-else
		class="auth-section"
		novalidate
		@submit.prevent="onRegister">
		<h2
			:id="titleId"
			class="auth-title">
			{{ authStore.isGuest ? m.saveProgressTitle : m.joinUsTitle }}
		</h2>

		<div class="dt-field">
			<label
				for="reg-email"
				class="dt-label"
				>{{ m.email }}</label
			>
			<input
				id="reg-email"
				v-model="email"
				type="email"
				class="dt-input"
				autocomplete="email"
				inputmode="email"
				required
				:aria-invalid="emailTouched && !emailValid"
				aria-describedby="reg-email-error"
				:placeholder="m.emailPlaceholder"
				@blur="emailTouched = true" />
			<p
				v-if="emailTouched && !emailValid"
				id="reg-email-error"
				class="dt-error-text">
				{{ m.invalidEmail }}
			</p>
		</div>

		<div class="dt-field">
			<label
				for="reg-password"
				class="dt-label"
				>{{ m.password }}</label
			>
			<PasswordInput
				id="reg-password"
				v-model="password"
				autocomplete="new-password"
				described-by="reg-password-rules" />
			<ul
				id="reg-password-rules"
				class="auth-rules">
				<li
					v-for="rule in passwordRules"
					:key="rule.id"
					:class="{ ok: rule.valid }">
					<i
						:class="rule.valid ? 'pi pi-check-circle' : 'pi pi-circle'"
						aria-hidden="true"></i>
					{{ rule.label }}
					<span class="sr-only">{{ rule.valid ? m.ruleDone : m.ruleMissing }}</span>
				</li>
			</ul>
		</div>

		<AuthErrorBanner
			:error="authStore.error"
			@dismiss="authStore.error = null" />

		<button
			type="submit"
			class="dt-btn dt-btn-primary dt-btn-block"
			:disabled="authStore.busy || !registerValid">
			<i
				v-if="authStore.busy"
				class="pi pi-spin pi-spinner"
				aria-hidden="true"></i>
			{{ m.createFreeAccount }}
		</button>

		<p class="auth-switch">
			{{ m.alreadyHaveAccount }}
			<button
				type="button"
				class="dt-link"
				@click="emit('switch-mode', 'login')">
				{{ m.signIn }}
			</button>
		</p>
	</form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore, type AuthDialogMode } from "@/stores/auth";
import { authMessages as m } from "@/i18n/messages/auth";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";
import PasswordInput from "@/components/login_view/PasswordInput.vue";
import { isValidEmail } from "./validation";

defineProps<{ titleId: string }>();
const emit = defineEmits<{ (e: "switch-mode", mode: AuthDialogMode): void }>();

// Stan formularza trzyma AuthDialog (zerowany przy otwarciu i zmianie trybu)
const email = defineModel<string>("email", { required: true });
const password = defineModel<string>("password", { required: true });
const emailTouched = defineModel<boolean>("emailTouched", { required: true });
const registered = defineModel<boolean>("registered", { required: true });

const authStore = useAuthStore();

const emailValid = computed(() => isValidEmail(email.value));

const passwordRules = computed(() => [
	{ id: "length", label: m.ruleLength, valid: password.value.length >= 8 },
	{ id: "mix", label: m.ruleLetterNumber, valid: /[a-zA-Z]/.test(password.value) && /\d/.test(password.value) },
]);
const registerValid = computed(
	() => emailValid.value && passwordRules.value.every((r) => r.valid),
);

async function onRegister() {
	emailTouched.value = true;
	if (!registerValid.value) return;
	try {
		await authStore.register(email.value, password.value);
		registered.value = true;
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}
</script>

<style scoped>
.auth-rules {
	list-style: none;
	margin: 0.2rem 0 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem 1rem;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.auth-rules li {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	transition: color 0.2s ease;
}
.auth-rules li.ok {
	color: var(--dt-success);
	font-weight: 600;
}
.auth-rules i {
	font-size: 0.75rem;
}
</style>
