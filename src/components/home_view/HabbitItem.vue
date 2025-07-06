<template>
	<Button
		@click="handleClick()"
		class="w-12 h-12 border-dashed"
		severity="secondary"
		variant="outlined"
		v-if="props.data.severity === 'empty'">
		<span class="material-icons material-symbols-outlined">{{
			data.icon
		}}</span>
	</Button>
	<Button
		@click="handleClick()"
		:severity="props.data.severity"
		class="w-12 h-12"
		v-else>
		<span class="material-icons material-symbols-outlined">{{
			data.icon
		}}</span>
	</Button>
</template>

<script setup lang="ts">
import { Button } from "primevue";
import { Habbit } from "@/libs/types";

const props = defineProps<{
	data: Habbit;
}>();

const emit = defineEmits(["select", "click"]);

function handleClick() {
	emit("select", props.data);
	emit("click", props.data);
}
</script>

<style scoped></style>
