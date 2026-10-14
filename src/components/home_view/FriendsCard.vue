<template>
	<section
		class="friends dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="friends-title">
		<!-- ============ NAGŁÓWEK ============ -->
		<FriendsHeader
			:is-social="isSocial"
			:code="code"
			@copy="copyCode"
			@share="shareInvite" />

		<div class="friends-scroll">
			<!-- ============ GOŚĆ ============ -->
			<FriendsEmpty
				v-if="!isSocial"
				variant="guest"
				:pending-invite="Boolean(friendsStore.pendingInvite)"
				@register="authStore.openAuthDialog('register')" />

			<template v-else>
				<!-- ============ ZAPROSZENIA ============ -->
				<FriendsRequests
					v-if="friendsStore.incoming.length || friendsStore.outgoing.length"
					:incoming="friendsStore.incoming"
					:outgoing="friendsStore.outgoing"
					@accept="friendsStore.accept"
					@decline="friendsStore.decline"
					@cancel="friendsStore.cancel" />

				<!-- ============ TEN TYDZIEŃ ============ -->
				<FriendsWeekBoard
					v-if="hasFriends"
					:board="friendsStore.board"
					:message="friendsStore.boardMessage"
					:private-count="privateCount" />

				<!-- ============ ZNAJOMI ============ -->
				<FriendsList
					v-if="hasFriends"
					:friends="friendsStore.friends"
					@open="openDetail" />

				<!-- ============ PUSTO ============ -->
				<FriendsEmpty
					v-if="showEmpty"
					variant="invite"
					:code="code"
					@invite="shareInvite"
					@add="openAdd()" />

				<p
					v-else-if="friendsStore.listenError && !hasFriends"
					class="friends-loading"
					role="status">
					We couldn't reach your friends right now 🌧️ Try again in a moment.
				</p>
				<p
					v-else-if="!friendsStore.loaded"
					class="friends-loading"
					role="status">
					Gathering your friends…
				</p>

				<button
					v-if="hasFriends || hasRequests"
					type="button"
					class="dt-btn dt-btn-soft dt-btn-block add-btn"
					@click="openAdd()">
					<i
						class="pi pi-user-plus"
						aria-hidden="true"></i>
					Add a friend
				</button>
			</template>
		</div>

		<AddFriendDialog
			v-if="addNeeded"
			v-model="addOpen"
			:initial-code="addCode"
			@done="addCode = null" />
		<FriendDetailDialog
			v-if="detailNeeded"
			v-model="detailOpen"
			:friend-uid="detailUid" />
	</section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useFriendsStore } from "@/stores/friends";
import { useProfileStore } from "@/stores/profile";
import { useInvite } from "@/utils/useInvite";
import FriendsHeader from "@/components/friends/FriendsHeader.vue";
import FriendsEmpty from "@/components/friends/FriendsEmpty.vue";
import FriendsRequests from "@/components/friends/FriendsRequests.vue";
import FriendsWeekBoard from "@/components/friends/FriendsWeekBoard.vue";
import FriendsList from "@/components/friends/FriendsList.vue";
const AddFriendDialog = defineAsyncComponent(
	() => import("@/components/friends/AddFriendDialog.vue"),
);
const FriendDetailDialog = defineAsyncComponent(
	() => import("@/components/friends/FriendDetailDialog.vue"),
);

const props = defineProps<{ isActive: boolean }>();

const authStore = useAuthStore();
const friendsStore = useFriendsStore();
const profileStore = useProfileStore();
const { copyCode, shareInvite } = useInvite();

const isSocial = computed(() => profileStore.isSocial);
const code = computed(() => profileStore.friendCode);
const hasFriends = computed(() => friendsStore.friends.length > 0);
const hasRequests = computed(
	() => friendsStore.incoming.length > 0 || friendsStore.outgoing.length > 0,
);
const showEmpty = computed(
	() =>
		friendsStore.loaded && !friendsStore.listenError && !hasFriends.value && !hasRequests.value,
);
const privateCount = computed(() => friendsStore.friends.filter((f) => !f.shares).length);

// ---- Dialogi (ładowane dopiero przy pierwszym użyciu)
const addOpen = ref(false);
const addNeeded = ref(false);
const addCode = ref<string | null>(null);
function openAdd(initial: string | null = null) {
	addCode.value = initial;
	addNeeded.value = true;
	addOpen.value = true;
}

const detailOpen = ref(false);
const detailNeeded = ref(false);
const detailUid = ref<string | null>(null);
function openDetail(uid: string) {
	detailUid.value = uid;
	detailNeeded.value = true;
	detailOpen.value = true;
}

// Link z zaproszeniem: po zalogowaniu od razu pytamy „Dodać Anię?”
watch(
	() =>
		[
			friendsStore.pendingInvite,
			isSocial.value && Boolean(code.value),
			props.isActive && !authStore.isAuthDialogOpen,
		] as const,
	([invite, ready, free]) => {
		if (invite && ready && free && !addOpen.value) openAdd(invite);
	},
	{ immediate: true },
);
</script>

<style scoped>
.friends {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}
@media (min-width: 641px) {
	.friends {
		width: 30rem;
	}
}
.friends.is-inactive {
	pointer-events: none;
	user-select: none;
}

/* Przewijana treść */
.friends-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin: 0 -0.35rem;
	padding: 0.25rem 0.35rem 0.75rem;
	overscroll-behavior: contain;
}
.friends-loading {
	margin: auto 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}
.add-btn {
	margin-top: auto;
}
</style>
