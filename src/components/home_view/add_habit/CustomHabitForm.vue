<template>
	<form
		class="dt-panel create-form"
		@submit.prevent="emit('submit')">
		<div class="dt-field">
			<label
				for="custom-name"
				class="dt-label"
				>Name your habit</label
			>
			<input
				id="custom-name"
				ref="nameRef"
				v-model="name"
				class="dt-input"
				maxlength="40"
				placeholder="e.g. Practice guitar" />
		</div>
		<fieldset class="icon-picker">
			<legend class="dt-label">Pick an icon</legend>
			<div class="icon-grid">
				<button
					v-for="choice in CUSTOM_ICONS"
					:key="choice"
					type="button"
					class="icon-choice"
					:aria-pressed="icon === choice"
					:aria-label="choice.replace(/_/g, ' ')"
					@click="icon = choice">
					<PixelIcon
						:icon="choice"
						:palette="negative ? 'plum' : 'orange'"
						:size="26" />
				</button>
			</div>
		</fieldset>
		<label
			v-if="mode === 'log'"
			class="negative-toggle dt-check-label">
			<input
				v-model="negative"
				type="checkbox"
				class="dt-check" />
			It's a habit I want to break
		</label>
		<div class="create-actions">
			<button
				type="button"
				class="dt-btn dt-btn-ghost dt-btn-sm"
				@click="emit('cancel')">
				Cancel
			</button>
			<button
				type="submit"
				class="dt-btn dt-btn-primary dt-btn-sm"
				:disabled="!name.trim()">
				{{ mode === "log" ? "Create & log" : "Create & add goal" }}
			</button>
		</div>
	</form>
</template>

<script setup lang="ts">
// Tworzenie własnego habitu
import { ref } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

defineProps<{ mode: "log" | "goal" }>();
const emit = defineEmits<{ (e: "submit"): void; (e: "cancel"): void }>();

// Szkic trzyma rodzic — może go wypełnić (np. z wyszukiwarki) zanim formularz się pojawi
const name = defineModel<string>("name", { required: true });
const icon = defineModel<string>("icon", { required: true });
const negative = defineModel<boolean>("negative", { required: true });

const CUSTOM_ICONS = [
	"star",
	"favorite",
	"bolt",
	"local_florist",
	"water_drop",
	"self_improvement",
	"fitness_center",
	"directions_run",
	"menu_book",
	"music_note",
	"brush",
	"code",
	"restaurant",
	"coffee",
	"bedtime",
	"sunny",
	"pets",
	"home",
	"school",
	"work",
	"savings",
	"spa",
	"psychology",
	"celebration",
	"rocket_launch",
	"flag",
	"trophy",
	"potted_plant",
];

const nameRef = ref<HTMLInputElement | null>(null);

defineExpose({ focus: () => nameRef.value?.focus() });
</script>

<style scoped>
.create-form {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	margin-bottom: 1rem;
}
.icon-picker {
	border: none;
	margin: 0;
	padding: 0;
}
.icon-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(2.6rem, 1fr));
	gap: 0.35rem;
	margin-top: 0.4rem;
}
.icon-choice {
	display: grid;
	place-items: center;
	height: 2.6rem;
	border-radius: 0.75rem;
	border: 2px solid transparent;
	background: var(--dt-surface);
	cursor: pointer;
	transition:
		background-color var(--dt-t-fast) ease,
		border-color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.icon-choice[aria-pressed="true"] {
	border-color: var(--dt-accent);
	background: var(--dt-accent-soft);
}
.icon-choice:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 1.4));
}
@media (hover: hover) {
	.icon-choice:hover {
		background: var(--dt-hover-bg);
		border-color: var(--dt-hover-border);
		transform: translateY(var(--dt-lift));
	}
	.icon-choice[aria-pressed="true"]:hover {
		border-color: var(--dt-accent);
		background: var(--dt-accent-soft);
	}
}
.negative-toggle {
	align-self: flex-start;
	padding-right: 0.5rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.create-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}
</style>
