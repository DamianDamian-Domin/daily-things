<template>
	<Transition name="offline">
		<div
			v-if="!pwa.isOnline"
			class="offline-badge"
			role="status">
			<i
				class="pi pi-cloud"
				aria-hidden="true"></i>
			<span>Offline · changes will sync when you're back</span>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { usePwaStore } from "@/stores/pwa";

const pwa = usePwaStore();
</script>

<style scoped>
/* Wąski pasek nad aplikacją (w układzie, nie na wierzchu) — niczego nie zasłania */
.offline-badge {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	padding: 0.3rem 1rem;
	border-bottom: 1px solid var(--dt-border);
	background: var(--dt-surface-sunken);
	color: var(--dt-text);
	font-size: var(--dt-text-xs);
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
}
.offline-badge i {
	color: var(--dt-accent-strong);
	font-size: 0.8rem;
}
.offline-badge span {
	overflow: hidden;
	text-overflow: ellipsis;
}

.offline-enter-active,
.offline-leave-active {
	transition:
		opacity 0.25s ease,
		margin-top 0.25s var(--dt-ease);
}
.offline-enter-from,
.offline-leave-to {
	opacity: 0;
	margin-top: -1.75rem;
}
</style>
