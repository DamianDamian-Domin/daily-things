import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import globals from "globals";

// Tylko reguły poprawności — formatowanie zostaje po stronie edytora
export default defineConfigWithVueTs(
	{ ignores: ["dist/**", "android/**", "node_modules/**", "scripts/**"] },
	js.configs.recommended,
	pluginVue.configs["flat/essential"],
	vueTsConfigs.recommended,
	{
		languageOptions: { globals: { ...globals.browser } },
		rules: {
			"vue/multi-word-component-names": "off",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
);
