<template>
	<div
		v-if="variant === 'guest'"
		class="friends-empty">
		<!-- ============ GOŚĆ ============ -->
		<div
			class="duo"
			aria-hidden="true">
			<PixelAvatar
				:avatar="profileStore.avatar"
				:size="64" />
			<span class="duo-heart">💛</span>
			<PixelAvatar
				:avatar="buddy"
				:size="64" />
		</div>
		<h3 class="empty-title">{{ m.guestTitle }}</h3>
		<p class="empty-text">
			{{ m.guestText }}
		</p>
		<p
			v-if="pendingInvite"
			class="invite-note">
			{{ m.guestInvite }}
		</p>
		<button
			type="button"
			class="dt-btn dt-btn-primary"
			@click="emit('register')">
			{{ m.createAccount }}
		</button>
	</div>

	<div
		v-else
		class="friends-empty">
		<!-- ============ PUSTO ============ -->
		<div
			class="duo"
			aria-hidden="true">
			<PixelAvatar
				:avatar="profileStore.avatar"
				:size="64" />
			<span class="duo-heart">💛</span>
			<span class="duo-ghost">?</span>
		</div>
		<h3 class="empty-title">{{ m.emptyTitle }}</h3>
		<p class="empty-text">
			{{ m.emptyText }}
		</p>
		<button
			type="button"
			class="dt-btn dt-btn-primary"
			:disabled="!code"
			@click="code && emit('invite', code)">
			<i
				class="pi pi-send"
				aria-hidden="true"></i>
			{{ m.inviteFriend }}
		</button>
		<button
			type="button"
			class="dt-link"
			@click="emit('add')">
			{{ m.haveCode }}
		</button>
	</div>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/stores/profile";
import { defaultAvatar } from "@/utils/avatar";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { friendsMessages as m } from "@/i18n/messages/friends";

// Puste stany karty: gość (zachęta do konta) albo konto bez znajomych (zaproś)
defineProps<{
	variant: "guest" | "invite";
	// Gość: czeka zaproszenie z linku
	pendingInvite?: boolean;
	// Konto: mój kod do udostępnienia
	code?: string | null;
}>();

const emit = defineEmits<{
	register: [];
	invite: [code: string];
	add: [];
}>();

const profileStore = useProfileStore();

// Przykładowy „kolega” w pustym stanie dla gościa
const buddy = defaultAvatar("daily-things-buddy");
</script>

<style scoped>
.friends-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.6rem;
	margin: auto 0;
	padding: 1rem 0.75rem;
	text-align: center;
}
.duo {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.3rem;
}
.duo-heart {
	font-size: 1.2rem;
	animation: duo-beat 2.4s ease-in-out infinite;
}
@keyframes duo-beat {
	0%,
	70%,
	100% {
		transform: scale(1);
	}
	80% {
		transform: scale(1.2);
	}
}
.duo-ghost {
	display: grid;
	place-items: center;
	width: 64px;
	height: 64px;
	border-radius: 19px;
	border: 2px dashed var(--dt-border-strong);
	color: var(--dt-text-3);
	font-size: 1.5rem;
	font-weight: 700;
}
.empty-title {
	font-size: var(--dt-text-md);
	font-weight: 700;
}
.empty-text {
	max-width: 22rem;
	margin: 0 0 0.4rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.5;
}
.invite-note {
	margin: 0 0 0.3rem;
	padding: 0.45rem 0.8rem;
	border-radius: var(--dt-radius);
	background: var(--dt-accent-softer);
	font-size: var(--dt-text-sm);
	color: var(--dt-accent-ink);
	font-weight: 600;
}
</style>
