import type { CookieConsentChoice, CookieConsentState } from "@/libs/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

const STORAGE_KEY = "cookieConsent.v1";
const CONSENT_VERSION = 1;

function createState(
	choice: CookieConsentChoice,
	analytics: boolean,
): CookieConsentState {
	return {
		choice,
		preferences: {
			necessary: true,
			analytics,
		},
		decidedAt: new Date().toISOString(),
		version: CONSENT_VERSION,
	};
}

export const useCookieConsentStore = defineStore("cookieConsent", () => {
	const consent = ref<CookieConsentState | null>(null);

	function persist() {
		if (typeof window === "undefined" || !consent.value) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(consent.value));
	}

	function loadFromStorage() {
		if (typeof window === "undefined") return;

		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;

		try {
			const parsed = JSON.parse(raw) as CookieConsentState;
			if (parsed?.version !== CONSENT_VERSION) return;
			if (parsed?.preferences?.necessary !== true) return;
			if (typeof parsed?.preferences?.analytics !== "boolean") return;

			consent.value = parsed;
		} catch {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	function acceptAll() {
		consent.value = createState("accepted_all", true);
		persist();
	}

	function acceptNecessaryOnly() {
		consent.value = createState("necessary_only", false);
		persist();
	}

	function saveCustom(analytics: boolean) {
		consent.value = createState("custom", analytics);
		persist();
	}

	function reopenBanner() {
		consent.value = null;
		if (typeof window !== "undefined") {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	const isBannerVisible = computed(() => !consent.value);
	const canUseAnalytics = computed(
		() => consent.value?.preferences.analytics ?? false,
	);

	loadFromStorage();

	return {
		consent,
		isBannerVisible,
		canUseAnalytics,
		acceptAll,
		acceptNecessaryOnly,
		saveCustom,
		reopenBanner,
		loadFromStorage,
	};
});