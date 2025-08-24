<template>
	<div class="flex flex-col items-center w-13">
		<!-- Ikona w przycisku -->
		<Button
			@click="handleClick()"
			:severity="
				props.data.severity === 'empty' ? 'secondary' : props.data.severity
			"
			:variant="props.data.severity === 'empty' ? 'outlined' : undefined"
			:class="props.data.severity === 'empty' ? 'border-dashed' : ''"
			class="w-12 h-12 flex items-center justify-center">
			<span
				class="material-icons material-symbols-outlined text-[24px] leading-none">
				{{ data.icon }}
			</span>
		</Button>

		<!-- Nazwa pod ikoną -->
		<span
			v-if="props.showLabel"
			class="text-c text-xs text-gray-600 text-center mt-1 leading-tight break-words italic">
			{{ data.display_name }}
		</span>
	</div>
</template>

<script setup lang="ts">
import { Button } from "primevue";
import { Habbit } from "@/libs/types";

const props = defineProps<{
	data: Habbit;
	showLabel?: boolean;
}>();

const emit = defineEmits(["select", "click"]);

function handleClick() {
	emit("select", props.data);
	emit("click", props.data);
}
</script>

<style scoped></style>
