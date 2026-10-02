<template>
	<Dialog
		:visible="authStore.isAuthDialogOpen"
		modal
		:closable="false"
		:show-header="false"
		:draggable="false"
		:close-on-escape="canDismiss"
		:dismissable-mask="canDismiss"
		:block-scroll="true"
		:pt="{
			root: { 'aria-labelledby': titleId },
			mask: { class: 'dt-dialog-mask auth-mask' },
		}"
		class="dt-dialog auth-dialog"
		:class="{ 'is-native': isNativePlatform }"
		@update:visible="onVisibleChange">
		<div class="auth-shell">
			<!-- Latające pixel-ikonki w tle -->
			<div
				class="auth-sky"
				aria-hidden="true">
				<PixelIcon
					v-for="(f, i) in floaters"
					:key="i"
					:icon="f.icon"
					:palette="f.palette"
					:size="f.size"
					class="auth-floater"
					:style="{
						left: f.left + '%',
						animationDuration: f.duration + 's',
						animationDelay: f.delay + 's',
					}" />
			</div>

			<button
				v-if="canDismiss"
				type="button"
				class="dt-icon-btn auth-close"
				:aria-label="authStore.isAuthenticated ? 'Close' : 'Close and try as guest'"
				@click="dismiss">
				<i
					class="pi pi-times"
					aria-hidden="true"></i>
			</button>

			<div class="auth-body">
				<button
					v-if="mode !== 'welcome' && !(isNativePlatform && mode === 'login')"
					type="button"
					class="dt-icon-btn auth-back"
					aria-label="Back"
					@click="goBack">
					<i
						class="pi pi-arrow-left"
						aria-hidden="true"></i>
				</button>

				<div class="auth-brand">
					<img
						src="@/assets/logo.png"
						alt=""
						width="72"
						height="72"
						class="auth-logo" />
					<p class="auth-wordmark">Daily Things</p>
				</div>

				<!-- ================= POWITANIE ================= -->
				<section
					v-if="mode === 'welcome'"
					class="auth-section">
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
							@click="switchMode(authStore.isGuest ? 'register' : 'login')">
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
							@click="dismiss">
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
							@click="switchMode('login')">
							Sign in
						</button>
						— we'll move your guest progress there.
					</p>
				</section>

				<!-- ================= LOGOWANIE ================= -->
				<form
					v-else-if="mode === 'login'"
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
								@click="switchMode('reset')">
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
							@click="switchMode('register')">
							Create an account
						</button>
					</p>
				</form>

				<!-- ================= REJESTRACJA ================= -->
				<template v-else-if="mode === 'register'">
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
							You're all set!
						</h2>
						<p class="auth-lead">
							We sent a verification link to <strong>{{ email }}</strong>. You can keep
							going right away — verify whenever it suits you.
						</p>
						<button
							type="button"
							class="dt-btn dt-btn-primary dt-btn-block"
							@click="authStore.closeAuthDialog()">
							Let's go
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
							{{ authStore.isGuest ? "Save your progress 🌿" : "Join us 🌿" }}
						</h2>

						<div class="dt-field">
							<label
								for="reg-email"
								class="dt-label"
								>Email</label
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
								placeholder="you@example.com"
								@blur="emailTouched = true" />
							<p
								v-if="emailTouched && !emailValid"
								id="reg-email-error"
								class="dt-error-text">
								Enter a valid email address.
							</p>
						</div>

						<div class="dt-field">
							<label
								for="reg-password"
								class="dt-label"
								>Password</label
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
									:key="rule.label"
									:class="{ ok: rule.valid }">
									<i
										:class="rule.valid ? 'pi pi-check-circle' : 'pi pi-circle'"
										aria-hidden="true"></i>
									{{ rule.label }}
									<span class="sr-only">{{ rule.valid ? "(done)" : "(missing)" }}</span>
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
							Create free account
						</button>

						<p class="auth-switch">
							Already have an account?
							<button
								type="button"
								class="dt-link"
								@click="switchMode('login')">
								Sign in
							</button>
						</p>
					</form>
				</template>

				<!-- ================= RESET HASŁA ================= -->
				<template v-else-if="mode === 'reset'">
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
							@click="switchMode('login')">
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

				<p class="auth-legal">
					By continuing you agree to our
					<button
						type="button"
						class="dt-link"
						@click="legalRef?.open('terms')">
						Terms
					</button>
					and
					<button
						type="button"
						class="dt-link"
						@click="legalRef?.open('privacy')">
						Privacy Policy
					</button>
					.
				</p>
			</div>
		</div>
	</Dialog>
	<LegalDocumentsDialog ref="legalRef" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import { useAuthStore, type AuthDialogMode } from "@/stores/auth";
import { isNativePlatform } from "@/utils/platform";
import { CATALOG, paletteFor } from "@/utils/habitCatalog";
import AuthErrorBanner from "@/components/login_view/AuthErrorBanner.vue";
import PasswordInput from "@/components/login_view/PasswordInput.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import LegalDocumentsDialog from "@/components/legal/LegalDocumentsDialog.vue";

const authStore = useAuthStore();
const legalRef = ref<InstanceType<typeof LegalDocumentsDialog> | null>(null);
const titleId = "auth-dialog-title";

const mode = computed(() => authStore.authDialogMode);
const email = ref("");
const password = ref("");
const emailTouched = ref(false);
const registered = ref(false);
const resetSent = ref(false);

// W aplikacji natywnej logowanie jest obowiązkowe
const canDismiss = computed(() => !isNativePlatform || authStore.isAuthenticated);

watch(
	() => authStore.isAuthDialogOpen,
	(open) => {
		if (open) {
			registered.value = false;
			resetSent.value = false;
			password.value = "";
			emailTouched.value = false;
		}
	},
);

function switchMode(next: AuthDialogMode) {
	authStore.error = null;
	registered.value = false;
	resetSent.value = false;
	authStore.authDialogMode = next;
}

function goBack() {
	switchMode(mode.value === "reset" ? "login" : "welcome");
}

// Zamknięcie bez logowania = tryb gościa (nigdy nie zostajemy „bez konta”)
async function dismiss() {
	if (authStore.isAuthenticated) {
		authStore.closeAuthDialog();
		return;
	}
	try {
		await authStore.continueAsGuest();
		authStore.closeAuthDialog();
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}

function onVisibleChange(visible: boolean) {
	if (!visible) dismiss();
}

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));

const passwordRules = computed(() => [
	{ label: "At least 8 characters", valid: password.value.length >= 8 },
	{ label: "A letter and a number", valid: /[a-zA-Z]/.test(password.value) && /\d/.test(password.value) },
]);
const registerValid = computed(
	() => emailValid.value && passwordRules.value.every((r) => r.valid),
);

async function onLogin() {
	try {
		await authStore.login(email.value, password.value);
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}

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

async function onGoogle() {
	try {
		await authStore.loginWithGoogle();
	} catch {
		/* komunikat pokazuje AuthErrorBanner */
	}
}

// Kilka ikon habitów spokojnie opadających w tle
const floaters = (() => {
	const pool = CATALOG.filter((h) => h.severity !== "danger");
	return Array.from({ length: 9 }, (_, i) => {
		const h = pool[Math.floor(Math.random() * pool.length)];
		return {
			icon: h.icon,
			palette: paletteFor(h),
			left: 4 + i * 11 + Math.random() * 5,
			duration: 14 + Math.random() * 10,
			delay: -Math.random() * 20,
			size: 26 + Math.round(Math.random() * 2) * 13,
		};
	});
})();
</script>

<style scoped>
.auth-shell {
	position: relative;
	overflow: hidden;
	min-height: 100%;
	background:
		radial-gradient(120% 60% at 50% 0%, var(--dt-accent-softer), transparent 70%),
		var(--dt-surface);
}

.auth-sky {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
}
.auth-floater {
	position: absolute;
	top: -60px;
	opacity: 0;
	animation: auth-float linear infinite;
}
/* Ikonki opadają tylko w górnej części (za logo) i znikają przed tekstem */
@keyframes auth-float {
	0% {
		transform: translateY(0) rotate(-8deg);
		opacity: 0;
	}
	15% {
		opacity: 0.3;
	}
	45% {
		opacity: 0;
		transform: translateY(260px) rotate(8deg);
	}
	100% {
		opacity: 0;
		transform: translateY(260px) rotate(8deg);
	}
}

.auth-close {
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	z-index: 2;
}
.auth-back {
	position: absolute;
	top: 0.75rem;
	left: 0.75rem;
	z-index: 2;
}

.auth-body {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 1rem;
	padding: 1.75rem 1.5rem 1.25rem;
}

.auth-brand {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.1rem;
}
.auth-logo {
	width: 4.5rem;
	height: 4.5rem;
	object-fit: contain;
	filter: drop-shadow(0 6px 12px rgba(181, 80, 26, 0.18));
}
.auth-wordmark {
	font-family: var(--dt-font-script);
	font-size: 2.2rem;
	line-height: 1;
	color: var(--dt-text-2);
	margin: 0;
}

.auth-section {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}
.auth-title {
	font-size: var(--dt-text-xl);
	font-weight: 700;
	text-align: center;
	line-height: 1.2;
}
.auth-lead {
	margin: -0.35rem 0 0.15rem;
	text-align: center;
	color: var(--dt-text-2);
	font-size: var(--dt-text-md);
	line-height: 1.5;
}
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

.auth-fineprint,
.auth-switch {
	margin: 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	line-height: 1.5;
}

.auth-label-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}
.auth-small-link {
	font-size: var(--dt-text-sm);
}

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

.auth-success {
	align-items: center;
	text-align: center;
}
.auth-success-badge {
	display: grid;
	place-items: center;
	width: 4rem;
	height: 4rem;
	border-radius: 1.2rem;
	background: var(--dt-success-soft);
	font-size: 2rem;
	animation: auth-pop 0.45s var(--dt-spring);
}
@keyframes auth-pop {
	from {
		transform: scale(0.5);
		opacity: 0;
	}
}

.auth-legal {
	margin: 0.25rem 0 0;
	text-align: center;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	line-height: 1.6;
}
.auth-legal .dt-link {
	font-size: inherit;
	font-weight: 600;
	padding: 0;
}
</style>

<style>
.auth-dialog.p-dialog {
	width: min(94vw, 26rem);
	max-height: 94dvh;
}
.auth-dialog .p-dialog-content {
	overflow-y: auto;
}
/* Natywnie: pełny ekran */
.auth-dialog.is-native.p-dialog {
	width: 100vw;
	height: 100dvh;
	max-height: 100dvh;
	border-radius: 0 !important;
	border: none !important;
}
.auth-dialog.is-native .auth-body {
	min-height: 100dvh;
	justify-content: center;
	padding-top: calc(1.5rem + env(safe-area-inset-top, 0px));
}
</style>
