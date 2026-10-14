import { useFriendsStore } from "@/stores/friends";
import { useToastStore } from "@/stores/toast";
import { friendsMessages as m } from "@/i18n/messages/friends";

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
		if (await copyText(code)) toast.show(m.codeCopied, { tone: "success" });
		else toast.error(m.copyFailed(code));
	}

	async function shareInvite(code: string) {
		const link = friendsStore.inviteLink(code);
		const text = m.shareText(code);
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
			toast.show(link ? m.inviteLinkCopied : m.inviteCopied, { tone: "success" });
		} else {
			toast.error(m.copyFailed(code));
		}
	}

	return { copyCode, shareInvite };
}
