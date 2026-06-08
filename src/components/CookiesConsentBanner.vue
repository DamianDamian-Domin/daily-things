<template>
	<transition name="consent-fade">
		<div
			v-if="isBannerVisible"
			class="pointer-events-none fixed left-0 right-0 z-[70] px-3 sm:px-4"
			:style="{ bottom: `${safeBottomOffset}px` }">
			<div
				class="pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 p-4 shadow-[0_10px_30px_rgba(120,53,15,0.16)] dark:border-orange-300/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="font-lora text-base font-semibold text-a">
							Your privacy matters ✨
						</p>
						<p class="mt-1 text-sm text-b">
							We use essential cookies to keep the app working. With your
							permission, we can also enable analytics to improve Daily Things.
						</p>
					</div>

					<Button
						text
						size="small"
						class="shrink-0"
						:label="showSettings ? 'Hide settings' : 'Settings'"
						@click="showSettings = !showSettings" />
				</div>

				<div
					v-if="showSettings"
					class="mt-3 rounded-xl border border-orange-200/70 bg-white/70 p-3 dark:border-gray-600 dark:bg-gray-900/35">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
						<div class="min-w-0">
							<p class="text-sm font-semibold text-a">Essential cookies</p>
							<p class="text-xs text-c">
								Always on. Without them, login and data persistence will not
								work properly.
							</p>
						</div>
						<Tag
							value="Always active"
							severity="success"
							class="self-start sm:self-auto shrink-0 whitespace-nowrap text-[11px] sm:text-xs"
							rounded />
					</div>

					<div class="mt-3 flex items-center justify-between gap-4">
						<div class="min-w-0">
							<p class="text-sm font-semibold text-a">Analytics</p>
							<p class="text-xs text-c">
								Helps us understand what can be improved in the app.
							</p>
						</div>
						<ToggleSwitch
							v-model="formState.analyticsEnabled"
							class="shrink-0"
							input-id="cookie-analytics" />
					</div>
				</div>

				<div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
					<Button
						label="Essential only"
						severity="secondary"
						@click="acceptNecessaryOnly" />
					<Button
						label="Save preferences"
						severity="secondary"
						@click="saveCustomSettings" />
					<Button
                        severity="success"
						label="Accept all"
						@click="acceptAll" />
				</div>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import Tag from "primevue/tag";
import { useCookieConsentStore } from "@/stores/cookieConsent";

const props = withDefaults(
	defineProps<{
		bottomOffset?: number;
	}>(),
	{
		bottomOffset: 12,
	},
);

const cookieConsentStore = useCookieConsentStore();
const showSettings = ref(false);
const formState = reactive({
	analyticsEnabled: false,
});

const isBannerVisible = computed(() => cookieConsentStore.consent === null);
const safeBottomOffset = computed(() => Math.max(props.bottomOffset, 0) + 12);

function acceptAll() {
	cookieConsentStore.acceptAll();
}

function acceptNecessaryOnly() {
	cookieConsentStore.acceptNecessaryOnly();
}

function saveCustomSettings() {
	cookieConsentStore.saveCustom(formState.analyticsEnabled);
}
</script>

<style scoped>
.consent-fade-enter-active,
.consent-fade-leave-active {
	transition: opacity 0.25s ease, transform 0.25s ease;
}

.consent-fade-enter-from,
.consent-fade-leave-to {
	opacity: 0;
	transform: translateY(18px);
}
</style>