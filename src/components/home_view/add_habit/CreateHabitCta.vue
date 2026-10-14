<template>
	<button
		type="button"
		class="create-cta"
		@click="emit('create')">
		<span
			class="create-plus"
			aria-hidden="true"
			>+</span
		>
		<span>
			<strong>{{ query ? `Create “${query.trim()}”` : "Create your own habit" }}</strong>
			<small>{{
				breaking ? "Something else you'd like to cut back on?" : "Can't find it? Make it yours."
			}}</small>
		</span>
	</button>
</template>

<script setup lang="ts">
// Zaproszenie do stworzenia własnego habitu
defineProps<{ query: string; breaking: boolean }>();
const emit = defineEmits<{ (e: "create"): void }>();
</script>

<style scoped>
.create-cta {
	display: flex;
	align-items: center;
	gap: 0.8rem;
	width: 100%;
	margin-top: 0.25rem;
	padding: 0.75rem 0.9rem;
	border-radius: var(--dt-radius-lg);
	border: 2px dashed var(--dt-border-strong);
	background: transparent;
	color: var(--dt-text);
	cursor: pointer;
	text-align: left;
	font-family: var(--dt-font);
	transition:
		border-color var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-ease);
}
.create-cta:active {
	transform: scale(calc(1 - (1 - var(--dt-press)) * 0.4));
}
@media (hover: hover) {
	.create-cta:hover {
		border-color: var(--dt-accent);
		background: var(--dt-hover-bg);
	}
	.create-cta:hover .create-plus {
		background: var(--dt-accent-strong);
		color: var(--dt-on-accent);
		transform: rotate(90deg);
	}
}
.create-cta span:last-child {
	display: flex;
	flex-direction: column;
}
.create-cta small {
	color: var(--dt-text-3);
	font-size: var(--dt-text-xs);
}
.create-plus {
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 0.8rem;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-size: 1.4rem;
	font-weight: 700;
	flex-shrink: 0;
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
</style>
