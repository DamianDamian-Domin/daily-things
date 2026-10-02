// Fonty hostowane lokalnie (bez Google Fonts CDN — szybciej, offline i zgodnie z RODO)
import "@fontsource-variable/lora/wght.css";
import "@fontsource-variable/lora/wght-italic.css";
import "@fontsource/sacramento/400.css";
import "./style.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import "primeicons/primeicons.css";

import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import { useAuthStore } from "@/stores/auth";

// Ciepły preset: pomarańczowy akcent + „kamienne” (stone) szarości zamiast
// zimnych zinc/gray. Wartości zgodne z tokenami --dt-* ze style.css.
const CozyPreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: "{orange.50}",
			100: "{orange.100}",
			200: "{orange.200}",
			300: "{orange.300}",
			400: "{orange.400}",
			500: "{orange.500}",
			600: "{orange.600}",
			700: "{orange.700}",
			800: "{orange.800}",
			900: "{orange.900}",
			950: "{orange.950}",
		},
		colorScheme: {
			light: {
				surface: {
					0: "#ffffff",
					50: "#fdf6ee",
					100: "#fbf0e4",
					200: "#f1e3d4",
					300: "#e3ccb5",
					400: "#b8a08d",
					500: "#7d6556",
					600: "#6b5446",
					700: "#54403a",
					800: "#3b2a20",
					900: "#2b1f18",
					950: "#1c1714",
				},
				primary: {
					color: "#b5501a",
					contrastColor: "#ffffff",
					hoverColor: "#9a4414",
					activeColor: "#86390f",
				},
				highlight: {
					background: "#ffedd5",
					focusBackground: "#fed7aa",
					color: "#9a3f0e",
					focusColor: "#7c2d12",
				},
			},
			dark: {
				surface: {
					0: "#ffffff",
					50: "#f5ebe1",
					100: "#d6c5b6",
					200: "#ad9b8e",
					300: "#8a786b",
					400: "#6b5a4e",
					500: "#4d4034",
					600: "#3a3028",
					700: "#2d251e",
					800: "#272019",
					900: "#221b16",
					950: "#1c1714",
				},
				primary: {
					color: "#f59a52",
					contrastColor: "#1f140c",
					hoverColor: "#ffae6e",
					activeColor: "#ffc28f",
				},
				highlight: {
					background: "rgba(245, 154, 82, 0.16)",
					focusBackground: "rgba(245, 154, 82, 0.24)",
					color: "#ffd9b8",
					focusColor: "#ffe7d1",
				},
				content: {
					background: "#272019",
					hoverBackground: "#2d251e",
					borderColor: "#3a3028",
					color: "#f5ebe1",
					hoverColor: "#ffffff",
				},
				overlay: {
					select: { background: "#272019", borderColor: "#3a3028", color: "#f5ebe1" },
					popover: { background: "#272019", borderColor: "#3a3028", color: "#f5ebe1" },
					modal: { background: "#272019", borderColor: "#3a3028", color: "#f5ebe1" },
				},
			},
		},
	},
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
	theme: {
		preset: CozyPreset,
		options: {
			darkModeSelector: ".my-app-dark",
			cssLayer: {
				name: "primevue",
				order: "theme, base, primevue",
			},
		},
	},
});
app.directive("tooltip", Tooltip);

// Montujemy dopiero, gdy Firebase powie, kto jest zalogowany — bez „mrugania”
// ekranu logowania. Do tego czasu widać lekki splash z index.html.
useAuthStore()
	.initAuth()
	.finally(() => app.mount("#app"));
