<template>
	<div
		@click="handleClick"
		:class="taskStyle"
		class="w-12 h-12 flex justify-center items-center rounded-md shadow-sm transition-all hover:cursor-pointer">
		<span class="material-icons material-symbols-outlined">{{
			data.icon
		}}</span>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	data: Object,
});

const emit = defineEmits(["select"]);

function handleClick() {
	emit("select", props);
}

const taskStyle = computed(() => {
	switch (props.data.severity) {
		case "success":
			return "surface-success hover:opacity-85";
		case "danger":
			return "surface-danger hover:opacity-85";
		case "warning":
			return "surface-warning hover:opacity-85";
		case "empty":
			return "border-secondary border border-dashed hover:surface-content-c";
		default:
			return "surface-content-a";
	}
});
</script>

<style scoped></style>
