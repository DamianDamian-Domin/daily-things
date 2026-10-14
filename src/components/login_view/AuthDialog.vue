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

				<AuthWelcome
					v-if="mode === 'welcome'"
					:title-id="titleId"
					@switch-mode="switchMode"
					@dismiss="dismiss" />
				<AuthLoginForm
					v-else-if="mode === 'login'"
					v-model:email="email"
					v-model:password="password"
					:title-id="titleId"
					@switch-mode="switchMode" />
				<AuthRegisterForm
					v-else-if="mode === 'register'"
					v-model:email="email"
					v-model:password="password"
					v-model:email-touched="emailTouched"
					v-model:registered="registered"
					:title-id="titleId"
					@switch-mode="switchMode" />
				<AuthResetForm
					v-else-if="mode === 'reset'"
					v-model:email="email"
					v-model:reset-sent="resetSent"
					:title-id="titleId"
					@switch-mode="switchMode" />

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
import AuthWelcome from "@/components/login_view/auth/AuthWelcome.vue";
import AuthLoginForm from "@/components/login_view/auth/AuthLoginForm.vue";
import AuthRegisterForm from "@/components/login_view/auth/AuthRegisterForm.vue";
import AuthResetForm from "@/components/login_view/auth/AuthResetForm.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import LegalDocumentsDialog from "@/components/legal/LegalDocumentsDialog.vue";

const authStore = useAuthStore();
const legalRef = ref<InstanceType<typeof LegalDocumentsDialog> | null>(null);
const titleId = "auth-dialog-title";

const mode = computed(() => authStore.authDialogMode);
// Stan formularzy jest tutaj, żeby email przetrwał zmianę trybu
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

/* Wspólne klasy widoków z ./auth/* (:deep, bo markup żyje w dzieciach) */
:deep(.auth-section) {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}
:deep(.auth-title) {
	font-size: var(--dt-text-xl);
	font-weight: 700;
	text-align: center;
	line-height: 1.2;
}
:deep(.auth-lead) {
	margin: -0.35rem 0 0.15rem;
	text-align: center;
	color: var(--dt-text-2);
	font-size: var(--dt-text-md);
	line-height: 1.5;
}

:deep(.auth-fineprint),
:deep(.auth-switch) {
	margin: 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	line-height: 1.5;
}

:deep(.auth-success) {
	align-items: center;
	text-align: center;
}
:deep(.auth-success-badge) {
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
