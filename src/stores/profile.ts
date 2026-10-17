import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { saveUserFields, type UserDoc } from "@/services/userData";
import { defaultAvatar, normalizeAvatar, sameAvatar, type AvatarConfig } from "@/utils/avatar";
import { plain } from "@/utils/plain";
import { profileMessages as m } from "@/i18n/messages/profile";

// ==========================================================================
// „Ja”: awatar, kod znajomego i imię widoczne dla znajomych.
// Lekki magazyn w głównym pakiecie (awatar jest w pasku nawigacji).
// Publikacja profilu dla znajomych → stores/profileSync.ts (ładowany leniwie).
// ==========================================================================

// Imię widoczne dla znajomych: nazwa wyświetlana albo „ładna” część adresu
// email (jan.kowalski83 → Jan) — nigdy cały adres
export function publicNameOf(user: { displayName: string | null; email: string | null } | null) {
	const name = user?.displayName?.trim();
	if (name) return name.slice(0, 40);
	const local = (user?.email ?? "").split("@")[0];
	const word = local.split(/[._\-+\d]+/).find((w) => w.length > 0) ?? "";
	return word ? (word[0].toUpperCase() + word.slice(1).toLowerCase()).slice(0, 40) : "Friend";
}

export const useProfileStore = defineStore("profile", () => {
	const authStore = useAuthStore();
	const toast = useToastStore();

	// ==========================================
	// STAN
	// ==========================================
	const savedAvatar = ref<AvatarConfig | null>(null);
	const friendCode = ref<string | null>(null);
	// Sesja wczytana (dokument użytkownika + historia) — dopiero wtedy publikujemy
	const ready = ref(false);
	const isEditorOpen = ref(false);

	const uid = computed(() => authStore.userUid);
	// Funkcje społecznościowe tylko dla kont (goście nie mają profilu)
	const isSocial = computed(() => Boolean(uid.value) && !authStore.isGuest);
	const avatar = computed<AvatarConfig>(
		() => savedAvatar.value ?? defaultAvatar(uid.value ?? "guest"),
	);
	const publicName = computed(() => publicNameOf(authStore.user));
	// Wizytówka do zaproszeń i kodu (taki sam kształt jak PersonSnapshot)
	const me = computed<{ name: string; avatar: AvatarConfig }>(() => ({
		name: publicName.value,
		avatar: plain(avatar.value),
	}));

	function hydrate(userDoc: UserDoc) {
		savedAvatar.value = normalizeAvatar(userDoc.avatar);
		friendCode.value = typeof userDoc.friendCode === "string" ? userDoc.friendCode : null;
	}

	function markReady() {
		ready.value = true;
	}

	function setFriendCode(code: string) {
		friendCode.value = code;
	}

	// ==========================================
	// AWATAR (zapis jak wszędzie: optymistycznie, z cofnięciem przy błędzie)
	// ==========================================
	function openEditor() {
		isEditorOpen.value = true;
	}

	function saveAvatar(cfg: AvatarConfig) {
		const currentUid = uid.value;
		if (!currentUid || sameAvatar(cfg, savedAvatar.value)) return;
		const previous = savedAvatar.value;
		savedAvatar.value = plain(cfg);
		saveUserFields(currentUid, { avatar: plain(cfg) }).catch((err) => {
			console.error("Avatar save failed", err);
			if (uid.value === currentUid) savedAvatar.value = previous;
			toast.error(m.avatarSaveFailed);
		});
	}

	function clear() {
		ready.value = false;
		savedAvatar.value = null;
		friendCode.value = null;
		isEditorOpen.value = false;
	}

	return {
		// stan
		savedAvatar,
		avatar,
		friendCode,
		ready,
		isSocial,
		publicName,
		me,
		isEditorOpen,
		// akcje
		hydrate,
		markReady,
		setFriendCode,
		openEditor,
		saveAvatar,
		clear,
	};
});
