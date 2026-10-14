<template>
	<div class="settings">
		<section
			class="settings-group"
			aria-labelledby="settings-look">
			<h3
				id="settings-look"
				class="settings-heading">
				Look & feel
			</h3>

			<div class="settings-row">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i :class="preferences.isDarkMode ? 'pi pi-moon' : 'pi pi-sun'"></i>
				</span>
				<div class="settings-text">
					<label
						for="pref-dark"
						class="settings-label"
						>Dark mode</label
					>
					<p class="settings-desc">Easier on the eyes in the evening</p>
				</div>
				<ToggleSwitch
					v-model="preferences.isDarkMode"
					input-id="pref-dark" />
			</div>

			<div class="settings-row">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i :class="preferences.soundEnabled ? 'pi pi-volume-up' : 'pi pi-volume-off'"></i>
				</span>
				<div class="settings-text">
					<label
						for="pref-sound"
						class="settings-label"
						>Sounds</label
					>
					<p class="settings-desc">Soft chimes when you tick things off</p>
				</div>
				<ToggleSwitch
					v-model="preferences.soundEnabled"
					input-id="pref-sound" />
			</div>

			<div class="settings-row">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i class="pi pi-sparkles"></i>
				</span>
				<div class="settings-text">
					<label
						for="pref-anim"
						class="settings-label"
						>Animations</label
					>
					<p class="settings-desc">Confetti, bounces and little celebrations</p>
				</div>
				<ToggleSwitch
					v-model="preferences.animationsEnabled"
					input-id="pref-anim" />
			</div>
		</section>

		<section
			v-if="!authStore.isGuest"
			class="settings-group"
			aria-labelledby="settings-friends">
			<h3
				id="settings-friends"
				class="settings-heading">
				Friends
			</h3>

			<div class="settings-row">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i class="pi pi-users"></i>
				</span>
				<div class="settings-text">
					<label
						for="pref-share"
						class="settings-label"
						>Share my progress with friends</label
					>
					<p
						id="pref-share-desc"
						class="settings-desc">
						Streak, daily goals and your week
					</p>
				</div>
				<ToggleSwitch
					v-model="preferences.shareProgress"
					input-id="pref-share"
					:pt="{ input: { 'aria-describedby': 'pref-share-desc' } }" />
			</div>

			<div
				class="settings-row is-nested">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i class="pi pi-eye"></i>
				</span>
				<div class="settings-text">
					<label
						for="pref-share-habits"
						class="settings-label"
						>Show which habits</label
					>
					<p
						id="pref-share-habits-desc"
						class="settings-desc">
						Today's habit icons. Habits you're cutting back on stay private.
					</p>
				</div>
				<ToggleSwitch
					v-model="preferences.shareHabits"
					input-id="pref-share-habits"
					:disabled="!preferences.shareProgress"
					:pt="{ input: { 'aria-describedby': 'pref-share-habits-desc' } }" />
			</div>
		</section>

		<section
			class="settings-group"
			aria-labelledby="settings-help">
			<h3
				id="settings-help"
				class="settings-heading">
				Help
			</h3>
			<button
				type="button"
				class="settings-link"
				@click="openHelp">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-question-circle"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">How Daily Things works</span>
					<span class="settings-desc">A quick picture tour of the app</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
		</section>

		<section
			class="settings-group"
			aria-labelledby="settings-privacy">
			<h3
				id="settings-privacy"
				class="settings-heading">
				Privacy
			</h3>
			<button
				type="button"
				class="settings-link"
				@click="manageCookies">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-shield"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">Cookie preferences</span>
					<span class="settings-desc">Review what we store on this device</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
			<button
				type="button"
				class="settings-link"
				@click="openLegal('privacy')">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-lock"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">Privacy Policy</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
			<button
				type="button"
				class="settings-link"
				@click="openLegal('terms')">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-file"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">Terms of Service</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
		</section>

		<p class="settings-footer">☕ Daily Things · made with care</p>
		<LegalDocumentsDialog ref="legalRef" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ToggleSwitch from "primevue/toggleswitch";
import LegalDocumentsDialog from "@/components/legal/LegalDocumentsDialog.vue";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useCookieConsentStore } from "@/stores/cookieConsent";
import { useAuthStore } from "@/stores/auth";
import { useHelpStore } from "@/stores/help";

const emit = defineEmits<{ (e: "close"): void }>();

const preferences = usePreferencesStore();
const cookieConsent = useCookieConsentStore();
const authStore = useAuthStore();
const help = useHelpStore();
const legalRef = ref<InstanceType<typeof LegalDocumentsDialog> | null>(null);

function manageCookies() {
	cookieConsent.reopenBanner();
	emit("close");
}

function openHelp() {
	emit("close");
	help.open();
}

function openLegal(doc: "privacy" | "terms") {
	legalRef.value?.open(doc);
}
</script>

<style scoped>
.settings {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}
.settings-group {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}
.settings-heading {
	font-size: var(--dt-text-xs);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--dt-text-3);
	margin: 0 0 0.35rem 0.25rem;
}
.settings-row,
.settings-link {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 0.6rem 0.5rem;
	border-radius: var(--dt-radius);
	text-align: left;
	width: 100%;
}
.settings-row.is-nested {
	padding-left: 1.25rem;
}
.settings-link {
	border: none;
	background: transparent;
	color: inherit;
	cursor: pointer;
	transition: background-color 0.18s ease;
}
.settings-link:hover {
	background: var(--dt-accent-softer);
}
.settings-icon {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 0.8rem;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	flex-shrink: 0;
}
.settings-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}
.settings-label {
	font-weight: 600;
	color: var(--dt-text);
	font-size: var(--dt-text-md);
}
.settings-desc {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
}
.settings-chevron {
	color: var(--dt-text-3);
	font-size: 0.75rem;
}
.settings-footer {
	margin: 0.5rem 0 0;
	text-align: center;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
</style>
