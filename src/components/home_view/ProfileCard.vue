<template>
	<div
		class="profile-card card-a sm:w-[480px] surface-content w-full h-full min-h-0 sm:min-h-[30rem] max-h-full sm:max-h-[50rem]"
		:class="!isActive && 'pointer-events-none opacity-70'">
		<div class="profile-scroll">
			<div class="profile-header">
				<div class="profile-avatar-lg">
					<img
						v-if="userPhotoUrl"
						:src="userPhotoUrl"
						alt="Avatar"
						class="profile-avatar-img"
						referrerpolicy="no-referrer" />
					<span
						v-else
						class="profile-avatar-initials">{{ userInitials }}</span>
				</div>
				<div class="profile-header-info">
					<p class="profile-greeting">{{ greeting }} 👋</p>
					<p class="profile-name">{{ userDisplayName }}</p>
					<p class="profile-email">{{ userEmail }}</p>
				</div>
			</div>

			<div class="profile-divider"></div>

			<div class="profile-section">
				<h4 class="profile-section-title">
					<i class="pi pi-pencil"></i> Display name
				</h4>
				<div class="profile-field-row">
					<InputText
						v-model="displayNameInput"
						class="flex-1"
						placeholder="Your name..."
						:disabled="savingName" />
					<Button
						:label="savingName ? '' : 'Save'"
						:icon="savingName ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
						:disabled="!nameChanged || savingName"
						size="small"
						@click="onSaveDisplayName" />
				</div>
				<Transition name="profile-msg">
					<p
						v-if="nameSuccess"
						class="profile-success-msg">
						<i class="pi pi-check-circle"></i> Name updated ✨
					</p>
				</Transition>
				<Transition name="profile-msg">
					<p
						v-if="nameError"
						class="profile-error-msg">
						<i class="pi pi-exclamation-circle"></i> {{ nameError }}
					</p>
				</Transition>
			</div>

			<div class="profile-divider"></div>

			<div class="profile-section">
				<h4 class="profile-section-title">
					<i class="pi pi-lock"></i> Change password
				</h4>

				<template v-if="hasPasswordProvider">
					<div class="flex flex-col gap-3">
						<div>
							<label class="profile-label">Current password</label>
							<InputText
								v-model="currentPassword"
								type="password"
								class="w-full"
								placeholder="••••••"
								:disabled="savingPassword" />
						</div>
						<div>
							<label class="profile-label">New password</label>
							<InputText
								v-model="newPassword"
								type="password"
								class="w-full"
								placeholder="Min. 8 characters"
								:disabled="savingPassword" />
						</div>
						<div>
							<label class="profile-label">Repeat new password</label>
							<InputText
								v-model="confirmPassword"
								type="password"
								class="w-full"
								placeholder="Repeat password"
								:disabled="savingPassword"
								@keydown.enter.prevent="onChangePassword" />
						</div>

						<div
							v-if="newPassword.length > 0"
							class="profile-password-rules">
							<div
								v-for="rule in passwordRules"
								:key="rule.label"
								class="profile-rule"
								:class="{ fulfilled: rule.valid }">
								<i :class="rule.valid ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
								{{ rule.label }}
							</div>
							<div
								class="profile-rule"
								:class="{ fulfilled: passwordsMatch }">
								<i
									:class="passwordsMatch ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
								Passwords match
							</div>
						</div>

						<Button
							:label="savingPassword ? '' : 'Change password'"
							:icon="savingPassword ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
							:disabled="!canChangePassword || savingPassword"
							size="small"
							class="self-end"
							@click="onChangePassword" />

						<Transition name="profile-msg">
							<p
								v-if="passwordSuccess"
								class="profile-success-msg">
								<i class="pi pi-check-circle"></i> Password changed successfully 🔒
							</p>
						</Transition>
						<Transition name="profile-msg">
							<p
								v-if="passwordError"
								class="profile-error-msg">
								<i class="pi pi-exclamation-circle"></i> {{ passwordError }}
							</p>
						</Transition>
					</div>
				</template>
				<template v-else>
					<div class="profile-info-box">
						<i
							class="pi pi-google"
							style="font-size: 1.1rem; color: var(--p-orange-500)"></i>
						<p>
							You signed in with Google - your password is managed by your
							Google account.
						</p>
					</div>
				</template>
			</div>

			<div class="profile-divider"></div>

			<div class="profile-section">
				<h4 class="profile-section-title">
					<i class="pi pi-info-circle"></i> Account information
				</h4>
				<div class="profile-info-grid">
					<div class="profile-info-item">
						<span class="profile-info-label">Email</span>
						<span class="profile-info-value">{{ userEmail }}</span>
					</div>
					<div class="profile-info-item">
						<span class="profile-info-label">Account created</span>
						<span class="profile-info-value">{{ formattedCreatedAt }}</span>
					</div>
					<div class="profile-info-item">
						<span class="profile-info-label">Signed in with</span>
						<span class="profile-info-value">{{ providerLabel }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

defineProps<{ isActive: boolean }>();

const authStore = useAuthStore();
const { user, hasPasswordProvider } = storeToRefs(authStore);

const userEmail = computed(() => user.value?.email ?? "");
const userDisplayName = computed(
	() => user.value?.displayName ?? userEmail.value.split("@")[0] ?? "",
);
const userPhotoUrl = computed(() => user.value?.photoURL ?? "");

const userInitials = computed(() => {
	const name = user.value?.displayName;
	if (name) {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}
	const email = user.value?.email ?? "";
	const local = email.split("@")[0] ?? "";
	return local.substring(0, 2).toUpperCase() || "?";
});

const greeting = computed(() => {
	const hour = new Date().getHours();
	if (hour < 6) return "Good night";
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Hi";
	return "Good evening";
});

const formattedCreatedAt = computed(() => {
	const raw = authStore.accountCreatedAt;
	if (!raw) return "-";
	const d = new Date(raw);
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
});

const providerLabel = computed(() => {
	const providers = user.value?.providerData?.map((p) => p.providerId) ?? [];
	if (providers.includes("google.com") && providers.includes("password")) {
		return "Google + email";
	}
	if (providers.includes("google.com")) return "Google";
	return "Email and password";
});

const displayNameInput = ref("");
const savingName = ref(false);
const nameSuccess = ref(false);
const nameError = ref<string | null>(null);

const nameChanged = computed(
	() =>
		displayNameInput.value.trim() !== "" &&
		displayNameInput.value.trim() !== (user.value?.displayName ?? ""),
);

watch(
	user,
	() => {
		displayNameInput.value = user.value?.displayName ?? "";
	},
	{ immediate: true },
);

const onSaveDisplayName = async () => {
	if (!nameChanged.value) return;
	savingName.value = true;
	nameError.value = null;
	nameSuccess.value = false;
	try {
		await authStore.updateDisplayName(displayNameInput.value.trim());
		nameSuccess.value = true;
		setTimeout(() => (nameSuccess.value = false), 3000);
	} catch {
		nameError.value = "Failed to update display name.";
	} finally {
		savingName.value = false;
	}
};

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const savingPassword = ref(false);
const passwordSuccess = ref(false);
const passwordError = ref<string | null>(null);

const passwordRules = computed(() => [
	{ label: "Min. 8 characters", valid: newPassword.value.length >= 8 },
	{ label: "Uppercase letter", valid: /[A-Z]/.test(newPassword.value) },
	{ label: "Lowercase letter", valid: /[a-z]/.test(newPassword.value) },
	{ label: "Number", valid: /\d/.test(newPassword.value) },
]);

const newPasswordValid = computed(() => passwordRules.value.every((r) => r.valid));
const passwordsMatch = computed(
	() => newPassword.value.length > 0 && newPassword.value === confirmPassword.value,
);
const canChangePassword = computed(
	() =>
		currentPassword.value.length >= 1 &&
		newPasswordValid.value &&
		passwordsMatch.value,
);

const onChangePassword = async () => {
	if (!canChangePassword.value) return;
	savingPassword.value = true;
	passwordError.value = null;
	passwordSuccess.value = false;
	try {
		await authStore.changePassword(currentPassword.value, newPassword.value);
		passwordSuccess.value = true;
		currentPassword.value = "";
		newPassword.value = "";
		confirmPassword.value = "";
		setTimeout(() => (passwordSuccess.value = false), 4000);
	} catch (e: any) {
		const code = e?.code ?? "";
		if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
			passwordError.value = "Current password is incorrect.";
		} else if (code === "auth/weak-password") {
			passwordError.value = "New password is too weak.";
		} else {
			passwordError.value = authStore.mapFirebaseError(code);
		}
	} finally {
		savingPassword.value = false;
	}
};
</script>

<style scoped>
.profile-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid var(--p-gray-200);
}
:where(.my-app-dark, .my-app-dark *) .profile-card {
	border: 1px solid var(--p-gray-800);
}
.profile-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--p-orange-200) transparent;
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}
:where(.my-app-dark, .my-app-dark *) .profile-scroll {
	scrollbar-color: var(--p-gray-600) transparent;
}
@media (max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse) {
	.profile-card {
		height: 100%;
		max-height: 100%;
	}
	.profile-scroll {
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
	}
}
.profile-header {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.profile-avatar-lg {
	width: 4rem;
	height: 4rem;
	border-radius: 1rem;
	overflow: hidden;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(145deg, var(--p-orange-300), var(--p-pink-300));
	box-shadow: 0 4px 12px color-mix(in srgb, var(--p-orange-300) 25%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .profile-avatar-lg {
	background: linear-gradient(145deg, var(--p-orange-700), var(--p-pink-700));
	box-shadow: 0 4px 12px color-mix(in srgb, var(--p-orange-900) 30%, transparent);
}
.profile-avatar-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.profile-avatar-initials {
	font-family: "Lora", serif;
	font-size: 1.25rem;
	font-weight: 600;
	color: white;
	user-select: none;
}
.profile-header-info {
	min-width: 0;
}
.profile-greeting {
	font-family: "Lora", serif;
	font-size: 0.75rem;
	font-style: italic;
	color: var(--p-orange-500);
}
:where(.my-app-dark, .my-app-dark *) .profile-greeting {
	color: var(--p-orange-400);
}
.profile-name {
	font-family: "Lora", serif;
	font-size: 1.15rem;
	font-weight: 600;
	color: var(--p-gray-800);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
:where(.my-app-dark, .my-app-dark *) .profile-name {
	color: var(--p-gray-100);
}
.profile-email {
	font-size: 0.75rem;
	color: var(--p-gray-400);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
:where(.my-app-dark, .my-app-dark *) .profile-email {
	color: var(--p-gray-300);
}
.profile-divider {
	height: 1px;
	background: var(--p-orange-100);
}
:where(.my-app-dark, .my-app-dark *) .profile-divider {
	background: var(--p-gray-700);
}
.profile-section {
	padding: 0.1rem 0;
}
.profile-section-title {
	font-family: "Lora", serif;
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--p-gray-600);
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin-bottom: 0.65rem;
}
.profile-section-title i {
	font-size: 0.85rem;
	opacity: 0.6;
}
:where(.my-app-dark, .my-app-dark *) .profile-section-title {
	color: var(--p-gray-300);
}
.profile-field-row {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}
.profile-label {
	display: block;
	font-size: 0.78rem;
	color: var(--p-gray-500);
	margin-bottom: 0.25rem;
	font-family: "Lora", serif;
}
:where(.my-app-dark, .my-app-dark *) .profile-label {
	color: var(--p-gray-300);
}

:where(.my-app-dark, .my-app-dark *) .profile-rule {
	color: var(--p-gray-300);
}
.profile-password-rules {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem 1rem;
}
.profile-rule {
	font-size: 0.75rem;
	color: var(--p-gray-400);
	display: flex;
	align-items: center;
	gap: 0.3rem;
}
.profile-rule i {
	font-size: 0.7rem;
}
.profile-rule.fulfilled {
	color: var(--p-green-500);
}
:where(.my-app-dark, .my-app-dark *) .profile-rule.fulfilled {
	color: var(--p-green-400);
}
.profile-info-box {
	display: flex;
	align-items: flex-start;
	gap: 0.65rem;
	padding: 0.75rem;
	border-radius: 0.75rem;
	background: var(--p-orange-50);
	font-size: 0.8rem;
	color: var(--p-gray-600);
	line-height: 1.4;
}
:where(.my-app-dark, .my-app-dark *) .profile-info-box {
	background: color-mix(in srgb, var(--p-orange-900) 20%, transparent);
	color: var(--p-gray-300);
}
.profile-info-grid {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.profile-info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.4rem 0;
}
.profile-info-label {
	font-size: 0.78rem;
	color: var(--p-gray-400);
	font-family: "Lora", serif;
}
:where(.my-app-dark, .my-app-dark *) .profile-info-label {
	color: var(--p-gray-300);
}

:where(.my-app-dark, .my-app-dark *) .profile-info-value {
	color: var(--p-gray-100);
}
.profile-info-value {
	font-size: 0.8rem;
	color: var(--p-gray-700);
	font-weight: 500;
	text-align: right;
	word-break: break-all;
}
:where(.my-app-dark, .my-app-dark *) .profile-info-value {
	color: var(--p-gray-200);
}
.profile-success-msg {
	font-size: 0.78rem;
	color: var(--p-green-600);
	display: flex;
	align-items: center;
	gap: 0.35rem;
	margin-top: 0.25rem;
}
:where(.my-app-dark, .my-app-dark *) .profile-success-msg {
	color: var(--p-green-400);
}
.profile-error-msg {
	font-size: 0.78rem;
	color: var(--p-red-500);
	display: flex;
	align-items: center;
	gap: 0.35rem;
	margin-top: 0.25rem;
}
:where(.my-app-dark, .my-app-dark *) .profile-error-msg {
	color: var(--p-red-400);
}
.profile-msg-enter-active,
.profile-msg-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}
.profile-msg-enter-from,
.profile-msg-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
</style>
