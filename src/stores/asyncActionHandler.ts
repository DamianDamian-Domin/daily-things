import { useFeedbackCheckStore } from "@/stores/useFeedbackCheck";

export async function handleAsyncAction<T>(
	callback: () => Promise<T>,
	successMessage: string,
	errorMessage = "An error occurred.",
): Promise<T | null> {
	const { showSuccessCheck, showErrorCheck } = useFeedbackCheckStore();

	try {
		// Wykonujemy naszą akcję (np. zapis do bazy) już bez loadera!
		await callback();

		// ✨ Czekamy chwilę przed pokazaniem komunikatu o sukcesie
		await new Promise((resolve) => setTimeout(resolve, 600));
		showSuccessCheck();
		return null;
	} catch (err) {
		console.error("error:", err);
		showErrorCheck();
		await new Promise((resolve) => setTimeout(resolve, 600));

		return null;
	}
}
