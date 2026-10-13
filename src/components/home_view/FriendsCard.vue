<template>
	<section
		class="friends dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="friends-title">
		<!-- ============ NAGŁÓWEK ============ -->
		<header class="friends-head">
			<button
				type="button"
				class="me-avatar"
				aria-label="Edit your avatar"
				@click="profileStore.openEditor()">
				<PixelAvatar
					:avatar="profileStore.avatar"
					:size="52" />
				<span
					class="me-edit"
					aria-hidden="true"
					><i class="pi pi-pencil"></i
				></span>
			</button>
			<div class="friends-id">
				<h2
					id="friends-title"
					class="friends-title">
					Friends <span aria-hidden="true">🌻</span>
				</h2>
				<div
					v-if="isSocial"
					class="code-row">
					<span class="code-label">Your code</span>
					<span
						v-if="code"
						class="code-value"
						aria-hidden="true"
						>{{ code }}</span
					>
					<span
						v-if="code"
						class="sr-only"
						>{{ code.split("").join(" ") }}</span
					>
					<span
						v-else
						class="code-value is-loading"
						>······</span
					>
				</div>
				<p
					v-else
					class="friends-sub">
					Cheer each other on, gently.
				</p>
			</div>
			<div
				v-if="isSocial && code"
				class="code-actions">
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Copy your friend code"
					v-tooltip.bottom="'Copy code'"
					@click="copyCode(code)">
					<i
						class="pi pi-copy"
						aria-hidden="true"></i>
				</button>
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Share an invite link"
					v-tooltip.bottom="'Share invite'"
					@click="shareInvite(code)">
					<i
						class="pi pi-share-alt"
						aria-hidden="true"></i>
				</button>
			</div>
		</header>

		<div class="friends-scroll">
			<!-- ============ GOŚĆ ============ -->
			<div
				v-if="!isSocial"
				class="friends-empty">
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
				<h3 class="empty-title">Friends make habits stick</h3>
				<p class="empty-text">
					Create a free account to add friends, compare your weeks and send high-fives. Everything
					you've logged comes with you.
				</p>
				<p
					v-if="friendsStore.pendingInvite"
					class="invite-note">
					💌 You've got an invite waiting — it'll be ready right after you sign up.
				</p>
				<button
					type="button"
					class="dt-btn dt-btn-primary"
					@click="authStore.openAuthDialog('register')">
					Create free account
				</button>
			</div>

			<template v-else>
				<!-- ============ ZAPROSZENIA ============ -->
				<section
					v-if="friendsStore.incoming.length || friendsStore.outgoing.length"
					class="friends-section"
					aria-labelledby="requests-title">
					<h3
						id="requests-title"
						class="dt-section-title">
						Requests
					</h3>
					<ul class="req-list">
						<li
							v-for="r in friendsStore.incoming"
							:key="r.pairId"
							class="req-row is-incoming">
							<PixelAvatar
								:avatar="r.avatar"
								:size="40" />
							<span class="req-text">
								<strong>{{ r.name }}</strong>
								<span>wants to be friends</span>
							</span>
							<button
								type="button"
								class="dt-btn dt-btn-primary dt-btn-sm"
								:aria-label="`Accept ${r.name}`"
								@click="friendsStore.accept(r)">
								Accept
							</button>
							<button
								type="button"
								class="dt-icon-btn"
								:aria-label="`Decline request from ${r.name}`"
								@click="friendsStore.decline(r)">
								<i
									class="pi pi-times"
									aria-hidden="true"></i>
							</button>
						</li>
						<li
							v-for="r in friendsStore.outgoing"
							:key="r.pairId"
							class="req-row">
							<PixelAvatar
								:avatar="r.avatar"
								:size="40" />
							<span class="req-text">
								<strong>{{ r.name }}</strong>
								<span>Request sent · waiting 🌱</span>
							</span>
							<button
								type="button"
								class="dt-btn dt-btn-ghost dt-btn-sm"
								:aria-label="`Cancel request to ${r.name}`"
								@click="friendsStore.cancel(r)">
								Cancel
							</button>
						</li>
					</ul>
				</section>

				<!-- ============ TEN TYDZIEŃ ============ -->
				<section
					v-if="hasFriends"
					class="dt-panel week"
					aria-labelledby="week-title">
					<div class="week-head">
						<h3
							id="week-title"
							class="dt-section-title">
							This week
						</h3>
						<span class="week-hint">goals done since Monday</span>
					</div>
					<p
						v-if="friendsStore.boardMessage"
						class="week-msg">
						{{ friendsStore.boardMessage }}
					</p>
					<ol class="podium">
						<li
							v-for="e in friendsStore.board"
							:key="e.uid"
							class="podium-item"
							:class="{ 'is-me': e.isMe, [`rank-${e.rank}`]: e.rank <= 3 && e.total > 0 }">
							<span class="podium-avatar">
								<PixelAvatar
									:avatar="e.avatar"
									:size="44" />
								<span
									v-if="e.rank <= 3 && e.total > 0"
									class="podium-medal"
									aria-hidden="true"
									>{{ MEDALS[e.rank - 1] }}</span
								>
							</span>
							<span class="podium-name">{{ e.name }}</span>
							<span
								class="podium-bar"
								aria-hidden="true"
								><span :style="{ width: `${e.pct}%` }"></span
							></span>
							<span
								class="podium-pct"
								aria-hidden="true"
								>{{ e.total ? `${e.pct}%` : "—" }}</span
							>
							<span class="sr-only"
								>Rank {{ e.rank }}: {{ e.total ? `${e.pct}% of goals done` : "no goals yet" }}</span
							>
						</li>
					</ol>
					<p
						v-if="privateCount"
						class="week-private">
						{{ privateCount === 1 ? "1 friend keeps" : `${privateCount} friends keep` }} their week
						private 🌙
					</p>
				</section>

				<!-- ============ ZNAJOMI ============ -->
				<section
					v-if="hasFriends"
					class="friends-section"
					aria-labelledby="list-title">
					<h3
						id="list-title"
						class="dt-section-title">
						Your friends <span class="dt-muted">· {{ friendsStore.friends.length }}</span>
					</h3>
					<ul class="friend-list">
						<li
							v-for="f in friendsStore.friends"
							:key="f.uid">
							<button
								type="button"
								class="friend-row"
								:aria-label="rowAria(f)"
								@click="openDetail(f.uid)">
								<PixelAvatar
									:avatar="f.avatar"
									:size="44" />
								<span class="friend-main">
									<span class="friend-name">{{ f.name }}</span>
									<span class="friend-meta">
										<template v-if="f.shares">
											<PixelIcon
												icon="local_fire_department"
												:palette="f.streak ? 'orange' : 'gray'"
												:size="16" />
											{{ f.streak ? `${f.streak}-day streak` : "No streak yet" }}
											<template v-if="f.away">
												<span class="friend-meta-sep">·</span>
												not here yet today
											</template>
										</template>
										<template v-else>private 🌙</template>
									</span>
								</span>
								<span
									v-if="f.today"
									class="dt-ring"
									:class="{ 'is-complete': f.today.done >= f.today.total }"
									:style="{ '--pct': Math.round((f.today.done / f.today.total) * 100) }"
									aria-hidden="true">
									<span>{{ f.today.done }}/{{ f.today.total }}</span>
								</span>
								<i
									class="pi pi-chevron-right friend-chevron"
									aria-hidden="true"></i>
							</button>
						</li>
					</ul>
				</section>

				<!-- ============ PUSTO ============ -->
				<div
					v-if="showEmpty"
					class="friends-empty">
					<div
						class="duo"
						aria-hidden="true">
						<PixelAvatar
							:avatar="profileStore.avatar"
							:size="64" />
						<span class="duo-heart">💛</span>
						<span class="duo-ghost">?</span>
					</div>
					<h3 class="empty-title">Habits are cozier together</h3>
					<p class="empty-text">
						Invite a friend to cheer each other on, peek at each other's streaks and send
						high-fives.
					</p>
					<button
						type="button"
						class="dt-btn dt-btn-primary"
						:disabled="!code"
						@click="code && shareInvite(code)">
						<i
							class="pi pi-send"
							aria-hidden="true"></i>
						Invite a friend
					</button>
					<button
						type="button"
						class="dt-link"
						@click="openAdd()">
						Have a code? Add a friend
					</button>
				</div>

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
import { useFriendsStore, type FriendRow } from "@/stores/friends";
import { useProfileStore } from "@/stores/profile";
import { defaultAvatar } from "@/utils/avatar";
import { useInvite } from "@/utils/useInvite";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
const AddFriendDialog = defineAsyncComponent(
	() => import("@/components/friends/AddFriendDialog.vue"),
);
const FriendDetailDialog = defineAsyncComponent(
	() => import("@/components/friends/FriendDetailDialog.vue"),
);

const props = defineProps<{ isActive: boolean }>();

const MEDALS = ["🥇", "🥈", "🥉"];

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

// Przykładowy „kolega” w pustym stanie dla gościa
const buddy = defaultAvatar("daily-things-buddy");

function rowAria(f: FriendRow) {
	if (!f.shares) return `${f.name}, keeps progress private. Open details`;
	const streak = f.streak ? `${f.streak}-day streak` : "no streak yet";
	const today = f.today
		? `, ${f.today.done} of ${f.today.total} goals today`
		: f.away
			? ", not here yet today"
			: "";
	return `${f.name}, ${streak}${today}. Open details`;
}

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

/* Nagłówek */
.friends-head {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}
.me-avatar {
	position: relative;
	padding: 0;
	border: none;
	background: none;
	border-radius: 1rem;
	cursor: pointer;
	flex-shrink: 0;
	box-shadow: var(--dt-shadow-sm);
	transition:
		transform var(--dt-t) var(--dt-ease),
		box-shadow var(--dt-t) ease;
}
@media (hover: hover) {
	.me-avatar:hover {
		transform: translateY(var(--dt-lift));
		box-shadow: var(--dt-shadow-hover);
	}
}
.me-edit {
	position: absolute;
	right: -0.3rem;
	bottom: -0.3rem;
	display: grid;
	place-items: center;
	width: 1.35rem;
	height: 1.35rem;
	border-radius: 50%;
	background: var(--dt-surface);
	color: var(--dt-accent-ink);
	box-shadow: var(--dt-shadow-sm);
	font-size: 0.6rem;
}
.friends-id {
	flex: 1;
	min-width: 0;
}
.friends-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
	line-height: 1.25;
}
.friends-sub {
	margin: 0.15rem 0 0;
	font-size: var(--dt-text-sm);
	font-style: italic;
	color: var(--dt-text-3);
}
.code-row {
	display: flex;
	align-items: baseline;
	gap: 0.45rem;
	margin-top: 0.15rem;
}
.code-label {
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}
.code-value {
	font-size: var(--dt-text-md);
	font-weight: 700;
	letter-spacing: 0.16em;
	color: var(--dt-accent-ink);
}
.code-value.is-loading {
	color: var(--dt-text-3);
}
.code-actions {
	display: flex;
	gap: 0.1rem;
	flex-shrink: 0;
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
.friends-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

/* Zaproszenia */
.req-list,
.friend-list {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.req-row {
	display: flex;
	align-items: center;
	gap: 0.7rem;
	padding: 0.5rem 0.4rem 0.5rem 0.6rem;
	border-radius: var(--dt-radius);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface-soft);
}
.req-row.is-incoming {
	background: var(--dt-accent-softer);
	border-color: color-mix(in srgb, var(--dt-accent) 30%, var(--dt-border));
}
.req-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.req-text strong {
	font-size: var(--dt-text-md);
	color: var(--dt-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* Ten tydzień */
.week {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}
.week-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.5rem;
}
.week-hint {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	font-style: italic;
}
.week-msg {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
	line-height: 1.4;
}
.podium {
	display: flex;
	gap: 0.35rem;
	margin: 0 -0.2rem;
	padding: 0.35rem 0.2rem 0.15rem;
	list-style: none;
	overflow-x: auto;
	scrollbar-width: thin;
}
.podium-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	flex: 0 0 4.6rem;
	padding: 0.45rem 0.25rem 0.4rem;
	border-radius: var(--dt-radius);
	text-align: center;
}
.podium-item.is-me {
	background: var(--dt-accent-soft);
}
.podium-avatar {
	position: relative;
}
.podium-medal {
	position: absolute;
	right: -0.45rem;
	bottom: -0.35rem;
	font-size: 1rem;
	line-height: 1;
	filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}
.podium-name {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text);
}
.podium-bar {
	display: block;
	width: 3rem;
	height: 0.3rem;
	border-radius: 999px;
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.podium-bar span {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: var(--dt-accent);
	transition: width 0.4s var(--dt-ease);
}
.podium-item.rank-1 .podium-bar span {
	background: var(--dt-gold);
}
.podium-pct {
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-2);
	font-variant-numeric: tabular-nums;
}
.week-private {
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	font-style: italic;
}

/* Lista znajomych */
.friend-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	min-height: 3.5rem;
	padding: 0.45rem 0.5rem;
	border-radius: var(--dt-radius);
	border: 1px solid transparent;
	background: transparent;
	color: inherit;
	text-align: left;
	cursor: pointer;
	transition: background-color var(--dt-t-fast) ease;
}
@media (hover: hover) {
	.friend-row:hover {
		background: var(--dt-hover-bg);
	}
}
.friend-main {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}
.friend-name {
	font-weight: 700;
	color: var(--dt-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.friend-meta {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
}
.friend-meta-sep {
	margin: 0 0.15rem;
}
.friend-chevron {
	font-size: 0.75rem;
	color: var(--dt-text-3);
}

/* Puste stany */
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
