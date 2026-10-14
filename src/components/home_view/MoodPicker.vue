<template>
	<section
		class="mood"
		aria-labelledby="mood-title">
		<div class="mood-text">
			<h3
				id="mood-title"
				class="dt-section-title">
				{{ habitsStore.isSelectedToday ? "How's your day?" : "How was that day?" }}
			</h3>
			<p
				class="mood-hint"
				aria-live="polite">
				{{ hint }}
			</p>
		</div>
		<div
			class="mood-faces"
			role="radiogroup"
			aria-labelledby="mood-title">
			<button
				v-for="m in MOODS"
				:key="m.value"
				type="button"
				role="radio"
				class="mood-face"
				:class="{ 'is-on': current === m.value, 'is-dim': current && current !== m.value }"
				:aria-checked="current === m.value"
				:aria-label="m.label"
				v-tooltip.top="m.label"
				@click="pick(m.value)">
				<PixelIcon
					:icon="m.icon"
					:palette="m.palette"
					:size="30" />
			</button>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Mood } from "@/libs/types";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { useSound } from "@/utils/useSound";
import { MOODS, moodOption } from "@/utils/mood";

const habitsStore = useHabitsStore();
const { playHabitCheck, playUncheck } = useSound();

const current = computed(() => habitsStore.moodOn(habitsStore.selectedKey) ?? null);

const hint = computed(() => {
	const m = moodOption(current.value);
	if (!m) return "One tap. Your weekly recap shows which habits lift it.";
	return `${m.label} · tap again to clear`;
});

// Ta sama buźka drugi raz = wyczyść (pomyłkowe tapnięcie łatwo cofnąć)
function pick(value: Mood) {
	if (current.value === value) {
		playUncheck();
		habitsStore.setMood(null);
	} else {
		playHabitCheck();
		habitsStore.setMood(value);
	}
}
</script>

<style scoped>
.mood {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem 0.75rem;
}
.mood-text {
	flex: 1 1 10rem;
	min-width: 0;
}
.mood-hint {
	margin: 0.1rem 0 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.mood-faces {
	display: flex;
	gap: 0.25rem;
}
.mood-face {
	display: grid;
	place-items: center;
	width: 2.75rem;
	height: 2.75rem;
	padding: 0;
	border: 2px solid transparent;
	border-radius: 0.85rem;
	background: transparent;
	cursor: pointer;
	transition:
		transform 0.18s var(--dt-spring),
		opacity 0.2s ease,
		background-color 0.2s ease,
		border-color 0.2s ease;
}
.mood-face:hover {
	background: var(--dt-surface-sunken);
}
.mood-face:active {
	transform: scale(0.9);
}
.mood-face:focus-visible {
	outline: 2px solid var(--dt-accent);
	outline-offset: 2px;
}
.mood-face.is-on {
	background: var(--dt-accent-soft);
	border-color: color-mix(in srgb, var(--dt-accent) 60%, transparent);
	transform: scale(1.08);
}
.mood-face.is-dim {
	opacity: 0.45;
}
@media (prefers-reduced-motion: reduce) {
	.mood-face {
		transition: none;
	}
}
</style>
