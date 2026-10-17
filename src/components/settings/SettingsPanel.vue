<template>
	<div class="settings">
		<section
			class="settings-group"
			aria-labelledby="settings-look">
			<h3
				id="settings-look"
				class="settings-heading">
				{{ m.lookHeading }}
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
						>{{ m.darkMode }}</label
					>
					<p class="settings-desc">{{ m.darkModeDesc }}</p>
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
						>{{ m.sounds }}</label
					>
					<p class="settings-desc">{{ m.soundsDesc }}</p>
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
						>{{ m.animations }}</label
					>
					<p class="settings-desc">{{ m.animationsDesc }}</p>
				</div>
				<ToggleSwitch
					v-model="preferences.animationsEnabled"
					input-id="pref-anim" />
			</div>
			<div class="settings-row">
				<span
					class="settings-icon"
					aria-hidden="true">
					<i class="pi pi-language"></i>
				</span>
				<div class="settings-text">
					<span
						id="pref-lang"
						class="settings-label"
						>{{ m.language }}</span
					>
					<p class="settings-desc">{{ m.languageDesc }}</p>
				</div>
				<SelectButton
					:model-value="locale"
					:options="languageOptions"
					option-label="label"
					option-value="value"
					:allow-empty="false"
					aria-labelledby="pref-lang"
					size="small"
					class="lang-switch"
					@update:model-value="(v: Locale) => v && setLocale(v)" />
			</div>
		</section>

		<section
			v-if="!authStore.isGuest"
			class="settings-group"
			aria-labelledby="settings-friends">
			<h3
				id="settings-friends"
				class="settings-heading">
				{{ m.friendsHeading }}
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
						>{{ m.shareProgress }}</label
					>
					<p
						id="pref-share-desc"
						class="settings-desc">
						{{ m.shareProgressDesc }}
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
						>{{ m.shareHabits }}</label
					>
					<p
						id="pref-share-habits-desc"
						class="settings-desc">
						{{ m.shareHabitsDesc }}
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
			v-if="pwa.canInstall"
			class="settings-group"
			aria-labelledby="settings-app">
			<h3
				id="settings-app"
				class="settings-heading">
				{{ m.appHeading }}
			</h3>
			<button
				type="button"
				class="settings-link"
				@click="pwa.install()">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-download"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">{{ m.installApp }}</span>
					<span class="settings-desc">{{ m.installAppDesc }}</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
		</section>

		<section
			class="settings-group"
			aria-labelledby="settings-data">
			<h3
				id="settings-data"
				class="settings-heading">
				{{ m.dataHeading }}
			</h3>
			<button
				type="button"
				class="settings-link"
				:disabled="exporting"
				@click="exportHabits">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-calendar"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">{{ m.exportHabits }}</span>
					<span class="settings-desc">{{ m.exportHabitsDesc }}</span>
				</span>
				<i
					class="pi pi-download settings-chevron"
					aria-hidden="true"></i>
			</button>
			<button
				type="button"
				class="settings-link"
				:disabled="exporting"
				@click="exportTodos">
				<span
					class="settings-icon"
					aria-hidden="true"
					><i class="pi pi-list-check"></i
				></span>
				<span class="settings-text">
					<span class="settings-label">{{ m.exportTodos }}</span>
					<span class="settings-desc">{{ m.exportTodosDesc }}</span>
				</span>
				<i
					class="pi pi-download settings-chevron"
					aria-hidden="true"></i>
			</button>
		</section>

		<section
			class="settings-group"
			aria-labelledby="settings-help">
			<h3
				id="settings-help"
				class="settings-heading">
				{{ m.helpHeading }}
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
					<span class="settings-label">{{ m.howItWorks }}</span>
					<span class="settings-desc">{{ m.howItWorksDesc }}</span>
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
				{{ m.privacyHeading }}
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
					<span class="settings-label">{{ m.cookies }}</span>
					<span class="settings-desc">{{ m.cookiesDesc }}</span>
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
					<span class="settings-label">{{ m.privacyPolicy }}</span>
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
					<span class="settings-label">{{ m.terms }}</span>
				</span>
				<i
					class="pi pi-chevron-right settings-chevron"
					aria-hidden="true"></i>
			</button>
		</section>

		<p class="settings-footer">{{ m.footer }}</p>
		<LegalDocumentsDialog ref="legalRef" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ToggleSwitch from "primevue/toggleswitch";
import SelectButton from "primevue/selectbutton";
import LegalDocumentsDialog from "@/components/legal/LegalDocumentsDialog.vue";
import { usePreferencesStore } from "@/stores/userPreferences";
import { useCookieConsentStore } from "@/stores/cookieConsent";
import { useAuthStore } from "@/stores/auth";
import { useHelpStore } from "@/stores/help";
import { usePwaStore } from "@/stores/pwa";
import { useHabitsStore } from "@/stores/habits";
import { useTodosStore } from "@/stores/todos";
import { useToastStore } from "@/stores/toast";
import { locale, setLocale, type Locale } from "@/i18n";
import { settingsMessages as m } from "@/i18n/messages/settings";
import { exportFileName, habitsCsv, saveCsv, todosCsv } from "@/utils/csvExport";

const emit = defineEmits<{ (e: "close"): void }>();

const preferences = usePreferencesStore();
const cookieConsent = useCookieConsentStore();
const authStore = useAuthStore();
const help = useHelpStore();
const pwa = usePwaStore();
const habitsStore = useHabitsStore();
const todosStore = useTodosStore();
const toast = useToastStore();
const legalRef = ref<InstanceType<typeof LegalDocumentsDialog> | null>(null);

// Nazwy języków zawsze w ich własnym języku — łatwo wrócić, gdy ktoś się pomyli
const languageOptions: { label: string; value: Locale }[] = [
	{ label: "English", value: "en" },
	{ label: "Polski", value: "pl" },
];

const exporting = ref(false);

async function runExport(build: () => Promise<{ name: string; csv: string; count: number }>, done: (n: number) => string) {
	if (exporting.value) return;
	exporting.value = true;
	try {
		const { name, csv, count } = await build();
		await saveCsv(name, csv);
		toast.show(done(count), { tone: "success" });
	} catch (err) {
		// Anulowanie systemowego „Udostępnij” to nie błąd
		if ((err as Error)?.name !== "AbortError") {
			console.error("CSV export failed", err);
			toast.show(m.exportFailed, { tone: "error" });
		}
	} finally {
		exporting.value = false;
	}
}

function exportHabits() {
	return runExport(async () => {
		await habitsStore.ensureAllHistory();
		const days = habitsStore.days;
		const count = Object.values(days).reduce((sum, d) => sum + (d.habits?.length ?? 0), 0);
		return { name: exportFileName("habits"), csv: habitsCsv(days, habitsStore.resolve), count };
	}, m.exportedHabits);
}

function exportTodos() {
	return runExport(async () => {
		const todos = todosStore.userTodosList;
		return { name: exportFileName("todos"), csv: todosCsv(todos), count: todos.length };
	}, m.exportedTodos);
}

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
.settings-link:disabled {
	opacity: 0.6;
	cursor: progress;
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
.lang-switch {
	flex-shrink: 0;
}
.settings-footer {
	margin: 0.5rem 0 0;
	text-align: center;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
</style>
