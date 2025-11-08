import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoaderStore = defineStore("loading", () => {
	const isLoading = ref(false);
	const minDuration = 500; // minimalny czas w ms
	let loadingStartTime: number | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function startLoading() {
		if (isLoading.value) {
			return;
		}

		isLoading.value = true;
		loadingStartTime = Date.now();
	}

	function stopLoading() {
		if (isLoading.value && loadingStartTime) {
			const elapsed = Date.now() - loadingStartTime;
			const remaining = Math.max(minDuration - elapsed, 0);

			if (hideTimeout) clearTimeout(hideTimeout);
			hideTimeout = setTimeout(() => {
				isLoading.value = false;
				loadingStartTime = null;
			}, remaining);
		}
	}
	async function run<T>(callback: () => Promise<T>): Promise<T | null> {
		startLoading();
		try {
			const result = await callback();
			return result;
		} catch (err: any) {
			console.error("Loader error:", err);
			return null;
		} finally {
			stopLoading();
		}
	}

	return {
		isLoading,
		startLoading,
		stopLoading,
		run,
	};
});
