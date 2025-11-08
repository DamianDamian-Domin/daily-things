<template>
	<transition name="fade-slide">
		<div
			v-if="isVisible"
			:class="['feedback-check', typeCheck]">
			<i :class="iconClass"></i>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

const props = defineProps<{
	isVisible: boolean;
	typeCheck: "success" | "error";
}>();

const iconClass = computed(() => {
	return props.typeCheck === "success" ? "pi pi-check" : "pi pi-times";
});
</script>

<style scoped>
.feedback-check {
	position: fixed;
	bottom: 40px;
	left: 50%;
	transform: translateX(-50%);
	border-radius: 50%;
	width: 50px;
	height: 50px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	box-shadow: 0 0 20px rgba(72, 239, 128, 0.6);
	pointer-events: none;
	z-index: 1;
	will-change: transform, opacity;
}

.feedback-check.success {
	background: var(--p-green-500);
	color: white;
	box-shadow: 0 0 20px rgba(72, 239, 128, 0.6);
}

.feedback-check.error {
	background: var(--p-red-500);
	color: white;
	box-shadow: 0 0 20px rgba(255, 80, 80, 0.7);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
	transition: all 0.4s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
	opacity: 0;
	transform: translate(-50%, 100px);
}
</style>
