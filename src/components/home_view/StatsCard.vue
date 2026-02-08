<script setup lang="ts">
defineProps<{
	isActive: boolean;
}>();
</script>

<template>
	<div>
		<h2>Stats</h2>
		<p v-if="isActive">AKTYWNA</p>
	</div>
</template>
