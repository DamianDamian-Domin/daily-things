<template>
	<header class="friends-head">
		<!-- ============ NAGŁÓWEK ============ -->
		<button
			type="button"
			class="me-avatar"
			aria-label="Edit your avatar"
			@click="profileStore.openEditor()">
			<PixelAvatar
				:avatar="profileStore.avatar"
				:size="52" />
			<span
				class="me-edit"
				aria-hidden="true"
				><i class="pi pi-pencil"></i
			></span>
		</button>
		<div class="friends-id">
			<h2
				id="friends-title"
				class="friends-title">
				Friends <span aria-hidden="true">🌻</span>
			</h2>
			<div
				v-if="isSocial"
				class="code-row">
				<span class="code-label">Your code</span>
				<span
					v-if="code"
					class="code-value"
					aria-hidden="true"
					>{{ code }}</span
				>
				<span
					v-if="code"
					class="sr-only"
					>{{ code.split("").join(" ") }}</span
				>
				<span
					v-else
					class="code-value is-loading"
					>······</span
				>
			</div>
			<p
				v-else
				class="friends-sub">
				Cheer each other on, gently.
			</p>
		</div>
		<div
			v-if="isSocial && code"
			class="code-actions">
			<button
				type="button"
				class="dt-icon-btn"
				aria-label="Copy your friend code"
				v-tooltip.bottom="'Copy code'"
				@click="emit('copy', code)">
				<i
					class="pi pi-copy"
					aria-hidden="true"></i>
			</button>
			<button
				type="button"
				class="dt-icon-btn"
				aria-label="Share an invite link"
				v-tooltip.bottom="'Share invite'"
				@click="emit('share', code)">
				<i
					class="pi pi-share-alt"
					aria-hidden="true"></i>
			</button>
		</div>
	</header>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/stores/profile";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";

// Nagłówek karty: mój awatar, kod znajomego i akcje kopiuj/udostępnij
defineProps<{ isSocial: boolean; code: string | null }>();

const emit = defineEmits<{
	copy: [code: string];
	share: [code: string];
}>();

const profileStore = useProfileStore();
</script>

<style scoped>
.friends-head {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}
.me-avatar {
	position: relative;
	padding: 0;
	border: none;
	background: none;
	border-radius: 1rem;
	cursor: pointer;
	flex-shrink: 0;
	box-shadow: var(--dt-shadow-sm);
	transition:
		transform var(--dt-t) var(--dt-ease),
		box-shadow var(--dt-t) ease;
}
@media (hover: hover) {
	.me-avatar:hover {
		transform: translateY(var(--dt-lift));
		box-shadow: var(--dt-shadow-hover);
	}
}
.me-edit {
	position: absolute;
	right: -0.3rem;
	bottom: -0.3rem;
	display: grid;
	place-items: center;
	width: 1.35rem;
	height: 1.35rem;
	border-radius: 50%;
	background: var(--dt-surface);
	color: var(--dt-accent-ink);
	box-shadow: var(--dt-shadow-sm);
	font-size: 0.6rem;
}
.friends-id {
	flex: 1;
	min-width: 0;
}
.friends-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
	line-height: 1.25;
}
.friends-sub {
	margin: 0.15rem 0 0;
	font-size: var(--dt-text-sm);
	font-style: italic;
	color: var(--dt-text-3);
}
.code-row {
	display: flex;
	align-items: baseline;
	gap: 0.45rem;
	margin-top: 0.15rem;
}
.code-label {
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}
.code-value {
	font-size: var(--dt-text-md);
	font-weight: 700;
	letter-spacing: 0.16em;
	color: var(--dt-accent-ink);
}
.code-value.is-loading {
	color: var(--dt-text-3);
}
.code-actions {
	display: flex;
	gap: 0.1rem;
	flex-shrink: 0;
}
</style>
