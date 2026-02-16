<template>
	<div>
		<h2>STATS</h2>
		<p v-if="isActive">AKTYWNA</p>
	</div>
	<div>
		<button
			:disabled="!isActive"
			@click="testAction"
			style="margin-top: 12px">
			Test akcji
		</button>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	isActive: boolean;
}>();

function testAction() {
	if (!props.isActive) return;

	alert("Aktywna karta – logika działa 👍");
}
</script>
