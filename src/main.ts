import "./style.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";
import "primeicons/primeicons.css";

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
					0: "{gray.950}",
					50: "{gray.900}",
					100: "{gray.800}",
					200: "{gray.700}",
					300: "{gray.600}",
					400: "{gray.500}",
					500: "{gray.400}",
					600: "{gray.300}",
					700: "{gray.200}",
					800: "{gray.100}",
					900: "{gray.50}",
					950: "{gray.50}",
				},
				// Content background and text (dialogs, cards, popovers)
				content: {
					background: "{gray.800}",
					hoverBackground: "{gray.700}",
					borderColor: "{gray.600}",
					color: "{gray.100}",
					hoverColor: "{gray.50}",
				},
				// Form fields — transparent background, blended with container
				formField: {
					background: "transparent",
					disabledBackground: "{gray.800}",
					filledBackground: "transparent",
					filledHoverBackground: "transparent",
					filledFocusBackground: "transparent",
					borderColor: "{gray.600}",
					hoverBorderColor: "{gray.500}",
					focusBorderColor: "{primary.500}",
					invalidBorderColor: "{red.400}",
					color: "{gray.100}",
					disabledColor: "{gray.500}",
					placeholderColor: "{gray.500}",
					floatLabelColor: "{gray.400}",
					floatLabelFocusColor: "{primary.400}",
					floatLabelInvalidColor: "{red.400}",
					iconColor: "{gray.400}",
					shadow: "none",
				},
				// Overlays (modal dialog, popover, dropdown)
				overlay: {
					select: {
						background: "{gray.800}",
						borderColor: "{gray.600}",
						color: "{gray.100}",
					},
					popover: {
						background: "{gray.800}",
						borderColor: "{gray.600}",
						color: "{gray.100}",
					},
					modal: {
						background: "{gray.800}",
						borderColor: "{gray.600}",
						color: "{gray.100}",
					},
				},
				// Navigation
				navigation: {
					item: {
						focusBackground: "{gray.700}",
						activeBackground: "{gray.700}",
						color: "{gray.300}",
						focusColor: "{gray.100}",
						activeColor: "{gray.100}",
						icon: {
							color: "{gray.500}",
							focusColor: "{gray.100}",
							activeColor: "{gray.100}",
						},
					},
				},
				// Highlight / selection
				highlight: {
					background: "color-mix(in srgb, {primary.500}, transparent 84%)",
					focusBackground: "color-mix(in srgb, {primary.500}, transparent 76%)",
					color: "rgba(255, 255, 255, 0.87)",
					focusColor: "rgba(255, 255, 255, 0.87)",
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
		dialog: {
			colorScheme: {
				dark: {
					root: {
						background: "{gray.800}",
						borderColor: "{gray.600}",
					},
					title: {
						color: "{gray.100}",
					},
				},
			},
		},
		popover: {
			colorScheme: {
				dark: {
					root: {
						background: "{gray.800}",
						borderColor: "{gray.600}",
					},
				},
			},
		},
		datepicker: {
			colorScheme: {
				dark: {
					root: {
						background: "{gray.800}",
					},
					header: {
						color: "{gray.100}",
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
app.use(ConfirmationService);
app.directive("tooltip", Tooltip);

const authStore = useAuthStore();

authStore.initAuth().then(() => {
	app.mount("#app");
});
