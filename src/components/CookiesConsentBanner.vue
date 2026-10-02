<template>
	<Transition name="consent">
		<section
			v-if="isBannerVisible"
			class="consent"
			:style="{ bottom: `calc(${bottomOffset + 12}px + env(safe-area-inset-bottom, 0px))` }"
			role="region"
			aria-labelledby="consent-title">
			<div class="consent-card">
				<div class="consent-text">
					<h2
						id="consent-title"
						class="consent-title">
						A quick note on privacy 🍪
					</h2>
					<p class="consent-desc">
						We only store what's needed to keep you signed in and save your progress. With your
						OK, we may also measure anonymous usage to make Daily Things better.
					</p>
				</div>

				<div
					v-if="showSettings"
					class="consent-settings">
					<div class="consent-row">
						<div>
							<p class="consent-row-title">Essential</p>
							<p class="consent-row-desc">Sign-in and saving your data. Always on.</p>
						</div>
						<span class="consent-always">Always on</span>
					</div>
					<div class="consent-row">
						<div>
							<label
								for="cookie-analytics"
								class="consent-row-title"
								>Anonymous analytics</label
							>
							<p class="consent-row-desc">Helps us see what to improve.</p>
						</div>
						<ToggleSwitch
							v-model="analyticsEnabled"
							input-id="cookie-analytics" />
					</div>
				</div>

				<div class="consent-actions">
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						:aria-expanded="showSettings"
						@click="showSettings = !showSettings">
						{{ showSettings ? "Hide options" : "Options" }}
					</button>
					<span class="consent-spacer"></span>
					<button
						v-if="showSettings"
						type="button"
						class="dt-btn dt-btn-outline dt-btn-sm"
						@click="cookieConsentStore.saveCustom(analyticsEnabled)">
						Save choice
					</button>
					<template v-else>
						<button
							type="button"
							class="dt-btn dt-btn-outline dt-btn-sm"
							@click="cookieConsentStore.acceptNecessaryOnly()">
							Essential only
						</button>
						<button
							type="button"
							class="dt-btn dt-btn-primary dt-btn-sm"
							@click="cookieConsentStore.acceptAll()">
							Accept all
						</button>
					</template>
				</div>
			</div>
		</section>
	</Transition>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ToggleSwitch from "primevue/toggleswitch";
import { useCookieConsentStore } from "@/stores/cookieConsent";

withDefaults(defineProps<{ bottomOffset?: number }>(), { bottomOffset: 0 });

const cookieConsentStore = useCookieConsentStore();
const showSettings = ref(false);
const analyticsEnabled = ref(false);

const isBannerVisible = computed(() => cookieConsentStore.consent === null);
</script>

<style scoped>
.consent {
	position: fixed;
	left: 0;
	right: 0;
	z-index: 70;
	display: flex;
	justify-content: center;
	padding: 0 0.75rem;
	pointer-events: none;
}
.consent-card {
	pointer-events: auto;
	width: min(100%, 40rem);
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem 1.1rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface);
	border: 1px solid var(--dt-border);
	box-shadow: var(--dt-shadow-lg);
}
.consent-title {
	font-size: var(--dt-text-md);
	font-weight: 700;
}
.consent-desc {
	margin: 0.25rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.5;
}
.consent-settings {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	padding: 0.75rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface-soft);
}
.consent-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}
.consent-row-title {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text);
}
.consent-row-desc {
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.consent-always {
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-success);
	white-space: nowrap;
}
.consent-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}
.consent-spacer {
	flex: 1;
}

.consent-enter-active,
.consent-leave-active {
	transition:
		opacity 0.25s ease,
		transform 0.3s var(--dt-ease);
}
.consent-enter-from,
.consent-leave-to {
	opacity: 0;
	transform: translateY(16px);
}
</style>
