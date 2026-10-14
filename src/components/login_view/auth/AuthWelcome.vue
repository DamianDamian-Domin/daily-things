<template>
	<section class="auth-section">
		<h2
			:id="titleId"
			class="auth-title">
			{{ authStore.isGuest ? "Keep your progress safe" : "Your cozy daily ritual" }}
		</h2>
		<p class="auth-lead">
			{{
				authStore.isGuest
					? "Create a free account to sync your habits across devices. Everything you've logged comes with you."
					: "Track small habits, tick off to-dos and watch your streak grow — one gentle day at a time."
			}}
		</p>

		<div class="auth-actions">
			<button
				v-if="authStore.canUseGoogle"
				type="button"
				class="dt-btn dt-btn-outline dt-btn-block google-btn"
				:disabled="authStore.busy"
				@click="onGoogle">
				<svg
					viewBox="0 0 48 48"
					width="18"
					height="18"
					aria-hidden="true">
					<path
						fill="#FFC107"
						d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
					<path
						fill="#FF3D00"
						d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
					<path
						fill="#4CAF50"
						d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
					<path
						fill="#1976D2"
						d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
				</svg>
				Continue with Google
			</button>
			<button
				type="button"
				class="dt-btn dt-btn-primary dt-btn-block"
				@click="emit('switch-mode', authStore.isGuest ? 'register' : 'login')">
				<i
					class="pi pi-envelope"
					aria-hidden="true"></i>
				{{ authStore.isGuest ? "Sign up with email" : "Continue with email" }}
			</button>
		</div>

		<AuthErrorBanner
			:error="authStore.error"
			@dismiss="authStore.error = null" />

		<template v-if="!authStore.isAuthenticated && !isNativePlatform">
			<div
				class="auth-divider"
				role="separator">
				<span>or</span>
			</div>
			<button
				type="button"
				class="dt-btn dt-btn-ghost dt-btn-block"
				:disabled="authStore.busy"
				@click="emit('dismiss')">
				Try it first — no account needed
				<i
					class="pi pi-arrow-right"
					aria-hidden="true"></i>
			</button>
			<p class="auth-fineprint">
				Guest progress stays on this device. Create an account anytime — nothing gets
				lost.
			</p>
		</template>
		<p
			v-else-if="authStore.isGuest"
			class="auth-fineprint">
			Already have an account?
			<button
				type="button"
				class="dt-link"
				@click="emit('switch-mode', 'login')">
				Sign in
			</button>
			— we'll move your guest progress there.
		</p>
	</section>
</template>

<script setup lang="ts">
import { useAuthStore, type AuthDialogMode } from "@/stores/auth";
import { isNativePlatform } from "@/utils/platform";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";

defineProps<{ titleId: string }>();
const emit = defineEmits<{
	(e: "switch-mode", mode: AuthDialogMode): void;
	(e: "dismiss"): void;
}>();

const authStore = useAuthStore();

async function onGoogle() {
	try {
		await authStore.loginWithGoogle();
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}
</script>

<style scoped>
.auth-actions {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}
.google-btn {
	gap: 0.6rem;
}

.auth-divider {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: var(--dt-text-3);
	font-size: var(--dt-text-xs);
	text-transform: uppercase;
	letter-spacing: 0.12em;
}
.auth-divider::before,
.auth-divider::after {
	content: "";
	flex: 1;
	height: 1px;
	background: var(--dt-border-strong);
}
</style>
