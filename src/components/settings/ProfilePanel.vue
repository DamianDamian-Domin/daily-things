<template>
	<div class="profile">
		<div class="profile-head">
			<button
				type="button"
				class="profile-avatar"
				:aria-label="m.editAvatar"
				@click="profileStore.openEditor()">
				<PixelAvatar
					:avatar="profileStore.avatar"
					:size="60" />
				<span
					class="profile-avatar-edit"
					aria-hidden="true"
					><i class="pi pi-pencil"></i
				></span>
			</button>
			<div class="profile-id">
				<p class="profile-hello">{{ greeting }} 👋</p>
				<p class="profile-name">{{ authStore.displayName }}</p>
				<p
					v-if="!authStore.isGuest"
					class="profile-email">
					{{ authStore.email }}
				</p>
			</div>
		</div>

		<!-- ============ GOŚĆ ============ -->
		<section
			v-if="authStore.isGuest"
			class="dt-panel guest-card">
			<div class="guest-top">
				<PixelIcon
					icon="potted_plant"
					palette="green"
					:size="40" />
				<div>
					<h3 class="guest-title">{{ m.guestTitle }}</h3>
					<p class="guest-text">
						{{ m.guestText }}
					</p>
				</div>
			</div>
			<div class="guest-actions">
				<button
					v-if="authStore.canUseGoogle"
					type="button"
					class="dt-btn dt-btn-outline dt-btn-block"
					:disabled="authStore.busy"
					@click="onGoogle">
					<i
						class="pi pi-google"
						aria-hidden="true"></i>
					{{ m.saveWithGoogle }}
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-primary dt-btn-block"
					@click="openAuth('register')">
					{{ m.createAccount }}
				</button>
				<p class="guest-signin">
					{{ m.haveAccount }}
					<button
						type="button"
						class="dt-link"
						@click="openAuth('login')">
						{{ m.signIn }}
					</button>
				</p>
			</div>
		</section>

		<!-- ============ KONTO ============ -->
		<template v-else>
			<div
				v-if="authStore.hasPasswordProvider && !authStore.emailVerified"
				class="verify-banner"
				role="status">
				<i
					class="pi pi-envelope"
					aria-hidden="true"></i>
				<div class="verify-text">
					<strong>{{ m.verifyTitle }}</strong>
					<span>{{ m.verifyText }}</span>
				</div>
				<div class="verify-actions">
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						:disabled="verifyCooldown > 0"
						@click="resendVerification">
						{{ verifyCooldown > 0 ? m.verifySent(verifyCooldown) : m.resendLink }}
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						@click="authStore.reloadUser()">
						{{ m.iVerified }}
					</button>
				</div>
			</div>

			<section class="profile-section">
				<form
					class="dt-field"
					@submit.prevent="saveName">
					<label
						for="profile-name"
						class="dt-label"
						>{{ m.displayName }}</label
					>
					<div class="inline-row">
						<input
							id="profile-name"
							v-model="nameInput"
							class="dt-input"
							maxlength="40"
							autocomplete="nickname"
							:placeholder="m.namePlaceholder" />
						<button
							type="submit"
							class="dt-btn dt-btn-soft"
							:disabled="!nameChanged || savingName">
							{{ savingName ? m.saving : c.save }}
						</button>
					</div>
				</form>
			</section>

			<details
				v-if="authStore.hasPasswordProvider"
				class="profile-details">
				<summary>
					<i
						class="pi pi-lock"
						aria-hidden="true"></i>
					{{ m.changePassword }}
				</summary>
				<form
					class="password-form"
					@submit.prevent="changePassword">
					<div class="dt-field">
						<label
							for="pw-current"
							class="dt-label"
							>{{ m.currentPassword }}</label
						>
						<PasswordInput
							id="pw-current"
							v-model="currentPassword"
							autocomplete="current-password" />
					</div>
					<div class="dt-field">
						<label
							for="pw-new"
							class="dt-label"
							>{{ m.newPassword }}</label
						>
						<PasswordInput
							id="pw-new"
							v-model="newPassword"
							autocomplete="new-password"
							described-by="pw-hint" />
						<p
							id="pw-hint"
							class="dt-hint">
							{{ m.passwordHint }}
						</p>
					</div>
					<p
						v-if="passwordError"
						class="dt-error-text"
						role="alert">
						{{ passwordError }}
					</p>
					<button
						type="submit"
						class="dt-btn dt-btn-soft"
						:disabled="!canChangePassword || savingPassword">
						{{ savingPassword ? m.updating : m.updatePassword }}
					</button>
				</form>
			</details>

			<dl class="profile-facts">
				<div>
					<dt>{{ m.signedInWith }}</dt>
					<dd>{{ providerLabel }}</dd>
				</div>
				<div>
					<dt>{{ m.memberSince }}</dt>
					<dd>{{ memberSince }}</dd>
				</div>
			</dl>

			<button
				type="button"
				class="dt-btn dt-btn-outline dt-btn-block"
				@click="logout">
				<i
					class="pi pi-sign-out"
					aria-hidden="true"></i>
				{{ m.signOut }}
			</button>
		</template>

		<!-- ============ STREFA USUWANIA ============ -->
		<details class="profile-details danger-zone">
			<summary>
				<i
					class="pi pi-trash"
					aria-hidden="true"></i>
				{{ m.deleteTitle(authStore.isGuest) }}
			</summary>
			<div class="danger-body">
				<p>
					{{ m.deleteText(authStore.isGuest) }}
				</p>
				<button
					v-if="!confirmDelete"
					type="button"
					class="dt-btn dt-btn-danger dt-btn-sm"
					@click="confirmDelete = true">
					{{ m.deleteEverything }}
				</button>
				<div
					v-else
					class="inline-row">
					<button
						type="button"
						class="dt-btn dt-btn-danger dt-btn-sm"
						:disabled="deleting"
						@click="deleteAccount">
						{{ deleting ? m.deleting : m.deleteConfirm }}
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						@click="confirmDelete = false">
						{{ m.keepIt }}
					</button>
				</div>
			</div>
		</details>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAuthStore, mapFirebaseError, type AuthDialogMode } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { partOfDay } from "@/utils/date";
import PasswordInput from "@/components/login_view/PasswordInput.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { useProfileStore } from "@/stores/profile";
import { dateLocale } from "@/i18n";
import { profileMessages as m } from "@/i18n/messages/profile";
import { commonMessages as c } from "@/i18n/messages/common";

const emit = defineEmits<{ (e: "close"): void }>();

const authStore = useAuthStore();
const toast = useToastStore();
const profileStore = useProfileStore();

const greeting = computed(() => partOfDay().greeting);

const providerLabel = computed(() => {
	if (authStore.hasGoogleProvider && authStore.hasPasswordProvider) return m.providerBoth;
	if (authStore.hasGoogleProvider) return m.providerGoogle;
	return m.providerPassword;
});

const memberSince = computed(() => {
	const raw = authStore.accountCreatedAt;
	return raw
		? new Date(raw).toLocaleDateString(dateLocale(), { day: "numeric", month: "long", year: "numeric" })
		: "—";
});

function openAuth(mode: AuthDialogMode) {
	emit("close");
	authStore.openAuthDialog(mode);
}

async function onGoogle() {
	try {
		await authStore.loginWithGoogle();
		toast.show(m.googleSaved, { tone: "success" });
	} catch {
		if (authStore.error) toast.error(authStore.error);
	}
}

// ---- Nazwa wyświetlana
const nameInput = ref(authStore.user?.displayName ?? "");
watch(
	() => authStore.user?.displayName,
	(name) => (nameInput.value = name ?? ""),
);
const savingName = ref(false);
const nameChanged = computed(
	() => nameInput.value.trim() !== "" && nameInput.value.trim() !== (authStore.user?.displayName ?? ""),
);

async function saveName() {
	if (!nameChanged.value) return;
	savingName.value = true;
	try {
		await authStore.updateDisplayName(nameInput.value);
		toast.show(m.nameUpdated, { tone: "success" });
	} catch {
		toast.error(m.nameFailed);
	} finally {
		savingName.value = false;
	}
}

// ---- Weryfikacja emaila
const verifyCooldown = ref(0);
async function resendVerification() {
	try {
		await authStore.resendVerificationEmail();
		verifyCooldown.value = 60;
		const timer = setInterval(() => {
			if (--verifyCooldown.value <= 0) clearInterval(timer);
		}, 1000);
	} catch {
		toast.error(authStore.error ?? undefined);
	}
}

// ---- Hasło
const currentPassword = ref("");
const newPassword = ref("");
const savingPassword = ref(false);
const passwordError = ref<string | null>(null);
const canChangePassword = computed(
	() =>
		currentPassword.value.length > 0 &&
		newPassword.value.length >= 8 &&
		/[a-zA-Z]/.test(newPassword.value) &&
		/\d/.test(newPassword.value),
);

async function changePassword() {
	if (!canChangePassword.value) return;
	savingPassword.value = true;
	passwordError.value = null;
	try {
		await authStore.changePassword(currentPassword.value, newPassword.value);
		currentPassword.value = "";
		newPassword.value = "";
		toast.show(m.passwordUpdated, { tone: "success" });
	} catch (err) {
		passwordError.value = mapFirebaseError((err as { code?: string })?.code);
	} finally {
		savingPassword.value = false;
	}
}

// ---- Wylogowanie i usuwanie
async function logout() {
	emit("close");
	await authStore.logout();
}

const confirmDelete = ref(false);
const deleting = ref(false);
async function deleteAccount() {
	deleting.value = true;
	try {
		await authStore.deleteAccount();
		emit("close");
		toast.show(m.dataDeleted);
	} catch (err) {
		toast.error(mapFirebaseError((err as { code?: string })?.code));
	} finally {
		deleting.value = false;
		confirmDelete.value = false;
	}
}
</script>

<style scoped>
.profile {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.profile-head {
	display: flex;
	align-items: center;
	gap: 0.9rem;
}
.profile-avatar {
	position: relative;
	padding: 0;
	border: none;
	background: none;
	border-radius: 1.1rem;
	flex-shrink: 0;
	cursor: pointer;
	box-shadow: var(--dt-shadow-sm);
	transition: transform 0.2s var(--dt-ease);
}
.profile-avatar:hover {
	transform: scale(1.04);
}
.profile-avatar-edit {
	position: absolute;
	right: -0.3rem;
	bottom: -0.3rem;
	display: grid;
	place-items: center;
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 50%;
	background: var(--dt-surface);
	color: var(--dt-accent-ink);
	box-shadow: var(--dt-shadow-sm);
	font-size: 0.6rem;
}
.profile-id {
	min-width: 0;
}
.profile-hello {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}
.profile-name {
	margin: 0;
	font-size: var(--dt-text-lg);
	font-weight: 700;
	color: var(--dt-text);
}
.profile-email {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	overflow: hidden;
	text-overflow: ellipsis;
}

.guest-card {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	background: linear-gradient(160deg, var(--dt-accent-softer), var(--dt-surface-soft));
}
.guest-top {
	display: flex;
	gap: 0.8rem;
	align-items: flex-start;
}
.guest-title {
	font-size: var(--dt-text-md);
	font-weight: 700;
	margin-bottom: 0.2rem;
}
.guest-text {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.5;
}
.guest-actions {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.guest-signin {
	margin: 0.2rem 0 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
}

.verify-banner {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.6rem 0.75rem;
	padding: 0.75rem 0.9rem;
	border-radius: var(--dt-radius);
	background: color-mix(in srgb, var(--dt-gold) 16%, var(--dt-surface));
	border: 1px solid color-mix(in srgb, var(--dt-gold) 40%, transparent);
	color: var(--dt-text);
}
.verify-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 12rem;
	font-size: var(--dt-text-sm);
}
.verify-text span {
	color: var(--dt-text-2);
}
.verify-actions {
	display: flex;
	gap: 0.4rem;
}

.inline-row {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}
.inline-row .dt-input {
	flex: 1;
	min-width: 0;
}

.profile-details {
	border: 1px solid var(--dt-border);
	border-radius: var(--dt-radius);
	background: var(--dt-surface-soft);
}
.profile-details summary {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.8rem 0.9rem;
	cursor: pointer;
	font-weight: 600;
	color: var(--dt-text-2);
	list-style: none;
	border-radius: var(--dt-radius);
}
.profile-details summary::-webkit-details-marker {
	display: none;
}
.profile-details summary::after {
	content: "›";
	margin-left: auto;
	font-size: 1.2rem;
	transition: transform 0.2s ease;
}
.profile-details[open] summary::after {
	transform: rotate(90deg);
}
.password-form,
.danger-body {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	padding: 0 0.9rem 0.9rem;
}
.danger-zone summary {
	color: var(--dt-danger);
}
.danger-body p {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.5;
}

.profile-facts {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.6rem;
	margin: 0;
}
.profile-facts div {
	padding: 0.6rem 0.75rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface-sunken);
}
.profile-facts dt {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.profile-facts dd {
	margin: 0.1rem 0 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
}
</style>
