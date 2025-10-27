import "./style.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ConfirmationService from "primevue/confirmationservice";

import App from "./App.vue";
import router from "./router";

import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";
import Tooltip from "primevue/tooltip";

import Aura from "@primeuix/themes/aura";

import { definePreset } from "@primeuix/themes";
import { useAuthStore } from "@/stores/auth";

import { useHabbitsStore } from "./stores/habbits";

const app = createApp(App);

const MyPreset = definePreset(Aura, {
	semantic: {
		colorScheme: {
			light: {
				surface: {
					0: "#ffffff",
					50: "{zinc.50}",
					100: "{zinc.100}",
					200: "{zinc.200}",
					300: "{zinc.300}",
					400: "{zinc.400}",
					500: "{zinc.500}",
					600: "{zinc.600}",
					700: "{zinc.700}",
					800: "{zinc.800}",
					900: "{zinc.900}",
					950: "{zinc.950}",
				},
			},
			dark: {
				surface: {
					0: "#ffffff",
					50: "{gray.50}",
					100: "{gray.100}",
					200: "{gray.200}",
					300: "{gray.300}",
					400: "{gray.400}",
					500: "{gray.500}",
					600: "{gray.600}",
					700: "{gray.700}",
					800: "{gray.800}",
					900: "{gray.900}",
					950: "{gray.950}",
				},
			},
		},
	},
	components: {
		divider: {
			colorScheme: {
				dark: {
					border: {
						color: "{gray.600}",
					},
				},
			},
		},
		button: {
			colorScheme: {
				light: {
					primary: {
						background: "{primary.200}",
						border: {
							color: "{primary.200}",
						},
						color: "{zinc.600}",
						hover: {
							background: "{primary.300}",
							border: {
								color: "{primary.300}",
							},
							color: "{zinc.600}",
						},
					},
				},
				dark: {
					primary: {
						background: "{primary.700}",
						border: {
							color: "{primary.700}",
						},
						color: "{zinc.200}",
						hover: {
							background: "{primary.800}",
							border: {
								color: "{primary.800}",
							},
							color: "{zinc.200}",
						},
					},
				},
			},
		},
	},
});

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
	theme: {
		preset: MyPreset,
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
app.use(ConfirmationService);

const authStore = useAuthStore();


authStore.initAuth().then(() => {
	app.mount("#app");
});
