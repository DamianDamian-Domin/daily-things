<template>
	<Transition name="fade">
		<div
			v-if="isLoading"
			class="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900/40 bg-opacity-50 z-50">
			<div class="loader-container">
				<svg
					version="1.1"
					id="colorful"
					viewBox="0 0 100 100"
					xml:space="preserve">
					<circle
						cx="6"
						cy="50"
						r="6">
						<animateTransform
							attributeName="transform"
							dur="1s"
							type="translate"
							values="0 15; 0 -15; 0 15"
							repeatCount="indefinite"
							begin="0.1" />
					</circle>
					<circle
						cx="30"
						cy="50"
						r="6">
						<animateTransform
							attributeName="transform"
							dur="1s"
							type="translate"
							values="0 10; 0 -10; 0 10"
							repeatCount="indefinite"
							begin="0.2" />
					</circle>
					<circle
						cx="54"
						cy="50"
						r="6">
						<animateTransform
							attributeName="transform"
							dur="1s"
							type="translate"
							values="0 5; 0 -5; 0 5"
							repeatCount="indefinite"
							begin="0.3" />
					</circle>
				</svg>
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useLoaderStore } from "@/stores/loader";
const loadingStore = useLoaderStore();
const { isLoading } = storeToRefs(loadingStore);
</script>

<style>
svg {
	width: 100px;
	height: 100px;
	margin: 50px;
	display: inline-block;
}

#colorful circle {
	fill: var(--color-green-500);
}
</style>
