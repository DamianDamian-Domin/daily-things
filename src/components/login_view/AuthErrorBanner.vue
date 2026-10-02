<template>
	<Transition name="auth-error">
		<div
			v-if="error"
			:key="shakeKey"
			class="auth-error"
			role="alert">
			<i
				class="pi pi-exclamation-circle"
				aria-hidden="true"></i>
			<span class="auth-error-text">{{ error }}</span>
			<button
				type="button"
				class="auth-error-close"
				aria-label="Dismiss message"
				@click="emit('dismiss')">
				<i
					class="pi pi-times"
					aria-hidden="true"></i>
			</button>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ error: string | null }>();
const emit = defineEmits<{ (e: "dismiss"): void }>();

// Nowy błąd → delikatne „potrząśnięcie”, żeby było widać zmianę
const shakeKey = ref(0);
watch(
	() => props.error,
	(next, prev) => {
		if (next && prev && next !== prev) shakeKey.value++;
	},
);
</script>

<style scoped>
.auth-error {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.6rem 0.4rem 0.6rem 0.85rem;
	border-radius: var(--dt-radius);
	background: var(--dt-danger-soft);
	border: 1px solid color-mix(in srgb, var(--dt-danger) 30%, transparent);
	color: var(--dt-danger);
	font-size: var(--dt-text-sm);
	font-weight: 600;
	line-height: 1.4;
	animation: auth-shake 0.4s ease;
}
.auth-error-text {
	flex: 1;
}
.auth-error-close {
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: inherit;
	cursor: pointer;
	flex-shrink: 0;
}
.auth-error-close:hover {
	background: color-mix(in srgb, var(--dt-danger) 14%, transparent);
}
.auth-error-close i {
	font-size: 0.7rem;
}

@keyframes auth-shake {
	20%,
	60% {
		transform: translateX(-3px);
	}
	40%,
	80% {
		transform: translateX(3px);
	}
}
.auth-error-enter-active,
.auth-error-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.auth-error-enter-from,
.auth-error-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
</style>
