import { useFeedbackCheckStore } from "@/stores/useFeedbackCheck";

export async function handleAsyncAction<T>(
	callback: () => Promise<T>,
	successMessage: string,
	errorMessage = "An error occurred.",
): Promise<T | null> {
	const { showErrorCheck } = useFeedbackCheckStore();

	try {
		await callback();
		return null;
	} catch (err) {
		console.error("error:", err);
		showErrorCheck();
		return null;
	}
}
