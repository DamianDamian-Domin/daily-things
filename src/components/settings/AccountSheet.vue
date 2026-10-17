<template>
	<Drawer
		v-model:visible="visible"
		:position="position"
		:show-close-icon="false"
		:block-scroll="true"
		:pt="{
			root: {
				class: ['account-sheet', `is-${position}`],
				role: 'dialog',
				'aria-modal': 'true',
				'aria-label': m.sheetAria,
			},
			mask: { class: 'dt-dialog-mask' },
		}">
		<template #container="{ closeCallback }">
			<div class="sheet">
				<div
					v-if="position === 'bottom'"
					class="sheet-grabber"
					aria-hidden="true"></div>
				<div class="sheet-head">
					<div
						class="dt-segmented"
						role="group"
						:aria-label="m.sectionAria">
						<button
							type="button"
							:aria-pressed="tab === 'profile'"
							@click="tab = 'profile'">
							{{ authStore.isGuest ? m.account : m.profile }}
						</button>
						<button
							type="button"
							:aria-pressed="tab === 'settings'"
							@click="tab = 'settings'">
							{{ m.settings }}
						</button>
					</div>
					<button
						type="button"
						class="dt-icon-btn"
						:aria-label="c.close"
						@click="closeCallback">
						<i
							class="pi pi-times"
							aria-hidden="true"></i>
					</button>
				</div>
				<div class="sheet-body">
					<ProfilePanel
						v-if="tab === 'profile'"
						@close="visible = false" />
					<SettingsPanel
						v-else
						@close="visible = false" />
				</div>
			</div>
		</template>
	</Drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Drawer from "primevue/drawer";
import { useAuthStore } from "@/stores/auth";
import ProfilePanel from "@/components/settings/ProfilePanel.vue";
import SettingsPanel from "@/components/settings/SettingsPanel.vue";
import { profileMessages as m } from "@/i18n/messages/profile";
import { commonMessages as c } from "@/i18n/messages/common";

const props = withDefaults(
	defineProps<{
		position?: "right" | "bottom";
		initialTab?: "profile" | "settings";
	}>(),
	{ position: "right", initialTab: "profile" },
);

const visible = defineModel<boolean>({ default: false });
const authStore = useAuthStore();
const tab = ref(props.initialTab);

watch(visible, (open) => {
	if (open) tab.value = props.initialTab;
});
watch(
	() => props.initialTab,
	(t) => (tab.value = t),
);
</script>

<style scoped>
.sheet {
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	min-height: 0;
	height: 100%;
	max-height: 100%;
	background: var(--dt-surface);
	color: var(--dt-text);
}
.sheet-grabber {
	width: 2.5rem;
	height: 0.3rem;
	border-radius: 999px;
	background: var(--dt-border-strong);
	margin: 0.6rem auto 0;
	flex-shrink: 0;
}
.sheet-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.85rem 1rem 0.5rem 1.25rem;
	flex-shrink: 0;
}
.sheet-body {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 0.75rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
	overscroll-behavior: contain;
}
</style>

<style>
.account-sheet.p-drawer {
	display: flex;
	flex-direction: column;
	border: none;
	background: var(--dt-surface);
	box-shadow: var(--dt-shadow-lg);
}
.account-sheet.is-right.p-drawer {
	width: min(100vw, 26rem);
	border-radius: var(--dt-radius-xl) 0 0 var(--dt-radius-xl);
}
.account-sheet.is-bottom.p-drawer {
	height: auto;
	max-height: 90dvh;
	border-radius: var(--dt-radius-xl) var(--dt-radius-xl) 0 0;
}
</style>
