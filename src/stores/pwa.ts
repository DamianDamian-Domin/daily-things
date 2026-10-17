import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToastStore } from "@/stores/toast";
import { isWebPlatform } from "@/utils/platform";
import { shouldApplyUpdateNow } from "@/utils/appUpdate";

// Zdarzenie Chrome/Edge/Androida — nie ma go w typach DOM
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Jak często szukać nowej wersji, gdy aplikacja jest długo otwarta
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// PWA: sieć (online/offline), instalacja z przeglądarki i aktualizacje po deployu
export const usePwaStore = defineStore("pwa", () => {
	const toast = useToastStore();

	const isOnline = ref(typeof navigator === "undefined" ? true : navigator.onLine);
	const installEvent = ref<BeforeInstallPromptEvent | null>(null);
	const isInstalled = ref(
		typeof window !== "undefined" &&
			(window.matchMedia?.("(display-mode: standalone)").matches ||
				(navigator as Navigator & { standalone?: boolean }).standalone === true),
	);
	const canInstall = computed(() => !!installEvent.value && !isInstalled.value);
	const updateReady = ref(false);

	let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;
	let started = false;

	function startNetworkWatch() {
		window.addEventListener("offline", () => {
			isOnline.value = false;
		});
		window.addEventListener("online", () => {
			isOnline.value = true;
			toast.show("Back online — your changes are syncing.", { tone: "success" });
		});
	}

	function startInstallWatch() {
		window.addEventListener("beforeinstallprompt", (e) => {
			// Własny przycisk w ustawieniach zamiast natrętnego mini-paska
			e.preventDefault();
			installEvent.value = e as BeforeInstallPromptEvent;
		});
		window.addEventListener("appinstalled", () => {
			installEvent.value = null;
			isInstalled.value = true;
		});
	}

	async function install() {
		const e = installEvent.value;
		if (!e) return;
		await e.prompt();
		const { outcome } = await e.userChoice;
		// Zdarzenia nie da się użyć drugi raz
		installEvent.value = null;
		if (outcome === "accepted") {
			isInstalled.value = true;
			toast.show("Daily Things is on your home screen now.", { tone: "success" });
		}
	}

	function reloadToUpdate() {
		applyUpdate?.(true);
	}

	async function startServiceWorker() {
		const startedAt = performance.now();
		let interacted = false;
		const markInteracted = () => {
			interacted = true;
		};
		window.addEventListener("pointerdown", markInteracted, { once: true, capture: true });
		window.addEventListener("keydown", markInteracted, { once: true, capture: true });

		const tryApplySilently = () => {
			if (!updateReady.value) return false;
			const now = shouldApplyUpdateNow({
				msSinceStart: performance.now() - startedAt,
				interacted,
				hidden: document.visibilityState === "hidden",
			});
			if (now) reloadToUpdate();
			return now;
		};

		let registration: ServiceWorkerRegistration | undefined;
		const checkForUpdate = () => {
			if (registration && navigator.onLine && !registration.installing) {
				registration.update().catch(() => {});
			}
		};

		// Wirtualny moduł vite-plugin-pwa (rejestracja + workbox-window)
		const { registerSW } = await import("virtual:pwa-register");
		applyUpdate = registerSW({
			onRegisteredSW(_url, reg) {
				registration = reg;
				setInterval(checkForUpdate, UPDATE_CHECK_MS);
			},
			onNeedRefresh() {
				updateReady.value = true;
				if (tryApplySilently()) return;
				toast.show("A new version of Daily Things is ready.", {
					actionLabel: "Reload",
					action: reloadToUpdate,
					duration: 10 * 60 * 1000,
				});
			},
		});

		document.addEventListener("visibilitychange", () => {
			// Schowana karta/apka: przeładowanie jest niewidoczne. Po powrocie
			// sprawdzamy, czy w międzyczasie nie było deployu.
			if (document.visibilityState === "hidden") tryApplySilently();
			else checkForUpdate();
		});
	}

	function init() {
		if (started || typeof window === "undefined") return;
		started = true;
		startNetworkWatch();
		// Android (Capacitor) ma własną instalację i aktualizacje przez sklep/APK
		if (!isWebPlatform) return;
		startInstallWatch();
		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			startServiceWorker().catch((err) => console.warn("Service worker setup failed", err));
		}
	}

	return { isOnline, canInstall, isInstalled, updateReady, init, install, reloadToUpdate };
});
