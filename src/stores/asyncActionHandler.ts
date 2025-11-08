import { useLoaderStore } from "@/stores/loader";
import { useFeedbackCheckStore } from "@/stores/useFeedbackCheck";

export async function handleAsyncAction<T>(
	callback: () => Promise<T>,
	successMessage: string,
	errorMessage = "An error occurred."
): Promise<T | null> {
	const loader = useLoaderStore();
	const { showSuccessCheck, showErrorCheck } = useFeedbackCheckStore();

	try {
		await loader.run(async () => {
			await callback();
		});

		// ✨ Poczekaj 300–600 ms po loaderze, zanim pokażesz
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
