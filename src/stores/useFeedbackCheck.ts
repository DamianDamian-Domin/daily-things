import { defineStore } from "pinia";
import { ref } from "vue";

export const useFeedbackCheckStore = defineStore("feedbackCheck", () => {
	let isVisible = ref(false);
	let typeCheck = ref<"success" | "error">("success");

	function showSuccessCheck() {
		typeCheck.value = "success";
		isVisible.value = true;
		setTimeout(() => {
			isVisible.value = false;
		}, 1200);
	}

	function showErrorCheck() {
		typeCheck.value = "error";
		isVisible.value = true;
		setTimeout(() => {
			isVisible.value = false;
		}, 1200);
	}

	return { isVisible, typeCheck, showSuccessCheck, showErrorCheck };
});
