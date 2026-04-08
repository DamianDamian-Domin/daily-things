<template>
	<div
		class="flex flex-col card-a sm:w-[480px] surface-content w-full h-4/5 min-h-[30rem] max-h-[50rem] overflow-auto">
		<h2>STATS</h2>
		<p v-if="isActive">ACTIVE</p>
		<div>
			<button
				:disabled="!isActive"
				@click="testAction"
				style="margin-top: 12px">
				Test action
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	isActive: boolean;
}>();

function testAction() {
	if (!props.isActive) return;

	alert("Active card — logic works 👍");
}
</script>
