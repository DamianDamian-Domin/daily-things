<template>
	<img
		:src="src"
		:width="size"
		:height="size"
		class="pixel-icon"
		:class="{ 'is-muted': muted }"
		alt=""
		aria-hidden="true"
		draggable="false"
		decoding="async" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { pixelIconUrl, type PaletteKey } from "@/utils/pixelIcons";

const props = withDefaults(
	defineProps<{
		icon: string;
		palette?: PaletteKey;
		size?: number;
		muted?: boolean;
	}>(),
	{ palette: "orange", size: 32, muted: false },
);

const src = computed(() => pixelIconUrl(props.icon, props.muted ? "ghost" : props.palette));
</script>

<style scoped>
.pixel-icon {
	display: block;
	image-rendering: pixelated;
	user-select: none;
	pointer-events: none;
	flex-shrink: 0;
}
</style>
