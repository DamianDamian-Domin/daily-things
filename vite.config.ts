import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
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
