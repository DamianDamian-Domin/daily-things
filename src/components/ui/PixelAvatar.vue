<template>
	<img
		:src="src"
		:width="size"
		:height="size"
		class="pixel-avatar"
		:style="{ borderRadius: `${Math.round(size * 0.3)}px` }"
		:alt="alt ?? ''"
		:aria-hidden="alt ? undefined : 'true'"
		draggable="false"
		decoding="async" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { avatarUrl, type AvatarConfig } from "@/utils/avatar";

const props = withDefaults(
	defineProps<{
		avatar: AvatarConfig;
		size?: number;
		// Bez alt awatar jest dekoracyjny (imię stoi obok)
		alt?: string;
	}>(),
	{ size: 40, alt: undefined },
);

const src = computed(() => avatarUrl(props.avatar));
</script>

<style scoped>
.pixel-avatar {
	display: block;
	flex-shrink: 0;
	image-rendering: pixelated;
	user-select: none;
	pointer-events: none;
	background: var(--dt-surface-sunken);
}
</style>
