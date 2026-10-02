<template>
	<div
		class="toast-host"
		:style="{ bottom: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))` }"
		role="status"
		aria-live="polite">
		<TransitionGroup name="toast">
			<div
				v-for="t in toastStore.toasts"
				:key="t.id"
				class="toast"
				:class="`tone-${t.tone}`">
				<span class="toast-msg">{{ t.message }}</span>
				<button
					v-if="t.actionLabel"
					type="button"
					class="toast-action"
					@click="toastStore.runAction(t.id)">
					{{ t.actionLabel }}
				</button>
				<button
					type="button"
					class="toast-close"
					aria-label="Dismiss"
					@click="toastStore.dismiss(t.id)">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>
		</TransitionGroup>
	</div>
</template>

<script setup lang="ts">
import { useToastStore } from "@/stores/toast";

withDefaults(defineProps<{ bottomOffset?: number }>(), { bottomOffset: 0 });

const toastStore = useToastStore();
</script>

<style scoped>
.toast-host {
	position: fixed;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1200;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	width: min(92vw, 26rem);
	pointer-events: none;
}

.toast {
	pointer-events: auto;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: fit-content;
	max-width: 100%;
	padding: 0.45rem 0.45rem 0.45rem 1rem;
	border-radius: var(--dt-radius-pill);
	background: #3b2a20;
	color: #fff7ed;
	box-shadow: var(--dt-shadow-lg);
	font-size: var(--dt-text-sm);
	font-weight: 600;
}
:where(.my-app-dark) .toast {
	background: #f5ebe1;
	color: #2b1f18;
}
.toast.tone-error {
	background: var(--dt-danger);
	color: #fff;
}
.toast.tone-success {
	background: #2f7d43;
	color: #fff;
}
.toast.tone-celebrate {
	background: linear-gradient(135deg, #b5501a, #d9822b);
	color: #fff;
}

.toast-msg {
	line-height: 1.3;
	padding: 0.2rem 0;
}

.toast-action {
	border: none;
	border-radius: var(--dt-radius-pill);
	padding: 0.35rem 0.8rem;
	background: rgba(255, 255, 255, 0.18);
	color: inherit;
	font-weight: 700;
	cursor: pointer;
	white-space: nowrap;
}
:where(.my-app-dark) .toast:not(.tone-error, .tone-success, .tone-celebrate) .toast-action {
	background: rgba(0, 0, 0, 0.08);
}
.toast-action:hover {
	background: rgba(255, 255, 255, 0.3);
}

.toast-close {
	display: grid;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: inherit;
	opacity: 0.7;
	cursor: pointer;
	flex-shrink: 0;
}
.toast-close:hover {
	opacity: 1;
}
.toast-close i {
	font-size: 0.7rem;
}

.toast-enter-active {
	transition:
		transform 0.35s var(--dt-spring),
		opacity 0.25s ease;
}
.toast-leave-active {
	transition:
		transform 0.2s ease,
		opacity 0.2s ease;
}
.toast-enter-from {
	opacity: 0;
	transform: translateY(16px) scale(0.92);
}
.toast-leave-to {
	opacity: 0;
	transform: translateY(-6px) scale(0.96);
}
</style>
