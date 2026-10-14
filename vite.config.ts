import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
		// PWA: instalacja z przeglądarki i start bez internetu. Service worker
		// trzyma w cache tylko „skorupę” aplikacji (HTML, JS, CSS, fonty, ikony);
		// dane działają offline dzięki trwałemu cache Firestore (src/firebase.ts).
		// Rejestracja tylko w przeglądarce — zob. src/pwa.ts (Android jej nie robi).
		VitePWA({
			// Nowa wersja czeka na zgodę/moment, w którym nie przeszkadza (src/pwa.ts)
			registerType: "prompt",
			injectRegister: false,
			// Manifest zostaje w public/site.webmanifest (już podpięty w index.html)
			manifest: false,
			workbox: {
				globPatterns: [
					"**/*.{js,css,html,woff2,ico,webmanifest}",
					"assets/*.png",
					"{android-chrome-*,apple-touch-icon,favicon-*}.png",
				],
				// Lora w alfabetach, których aplikacja nie używa, dociągnie się z sieci
				globIgnores: ["**/lora-{cyrillic,cyrillic-ext,greek,vietnamese,math,symbols}-*"],
				// Każdy adres aplikacji (SPA) offline → index.html z cache,
				// ale nie ścieżki Firebase (/__/auth/…, /__/firebase/…)
				navigateFallback: "/index.html",
				navigateFallbackDenylist: [/^\/__\//],
				cleanupOutdatedCaches: true,
			},
		}),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	// Duże JSON-y (katalog habitów, sprite'y) jako JSON.parse(...) — szybsze niż literał JS
	json: { stringify: true },
	build: {
		rollupOptions: {
			output: {
				// Biblioteki w osobnych plikach — przy aktualizacji aplikacji
				// przeglądarka pobiera ponownie tylko nasz kod, a nie całe Firebase
				manualChunks(id) {
					if (!id.includes("node_modules")) return;
					if (id.includes("firebase")) return "firebase";
					if (id.includes("primevue") || id.includes("@primeuix")) return "primevue";
					if (/node_modules\/(vue|@vue|pinia|vue-router)\//.test(id)) return "vue";
				},
			},
		},
	},
});
