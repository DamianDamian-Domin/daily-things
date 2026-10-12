import { useFriendsStore } from "@/stores/friends";
import { useToastStore } from "@/stores/toast";

// Kopiowanie kodu i udostępnianie zaproszenia (Web Share API, gdy jest)
export function useInvite() {
	const friendsStore = useFriendsStore();
	const toast = useToastStore();

	async function copyText(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}

	async function copyCode(code: string) {
		if (await copyText(code)) toast.show("Code copied 📋", { tone: "success" });
		else toast.error("Couldn't copy — your code is " + code);
	}

	async function shareInvite(code: string) {
		const link = friendsStore.inviteLink(code);
		const text = `Let's cheer each other on in Daily Things 🌻 My friend code: ${code}`;
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title: "Daily Things", text, ...(link ? { url: link } : {}) });
				return;
			} catch (err) {
				// Użytkownik zamknął arkusz udostępniania — nic nie robimy
				if ((err as { name?: string })?.name === "AbortError") return;
			}
		}
		if (await copyText(link ? `${text}\n${link}` : text)) {
			toast.show(link ? "Invite link copied 💌" : "Invite copied 💌", { tone: "success" });
		} else {
			toast.error("Couldn't copy — your code is " + code);
		}
	}

	return { copyCode, shareInvite };
}
