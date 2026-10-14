<template>
	<button
		type="button"
		class="friend-row"
		:aria-label="rowAria(friend)"
		@click="emit('open', friend.uid)">
		<PixelAvatar
			:avatar="friend.avatar"
			:size="44" />
		<span class="friend-main">
			<span class="friend-name">{{ friend.name }}</span>
			<span class="friend-meta">
				<template v-if="friend.shares">
					<PixelIcon
						icon="local_fire_department"
						:palette="friend.streak ? 'orange' : 'gray'"
						:size="16" />
					{{ friend.streak ? `${friend.streak}-day streak` : "No streak yet" }}
					<template v-if="friend.away">
						<span class="friend-meta-sep">·</span>
						not here yet today
					</template>
				</template>
				<template v-else>private 🌙</template>
			</span>
		</span>
		<span
			v-if="friend.today"
			class="dt-ring"
			:class="{ 'is-complete': friend.today.done >= friend.today.total }"
			:style="{ '--pct': Math.round((friend.today.done / friend.today.total) * 100) }"
			aria-hidden="true">
			<span>{{ friend.today.done }}/{{ friend.today.total }}</span>
		</span>
		<i
			class="pi pi-chevron-right friend-chevron"
			aria-hidden="true"></i>
	</button>
</template>

<script setup lang="ts">
// Tylko typy — store znajomych ładuje rodzic (kod społecznościowy jest leniwy)
import type { FriendRow } from "@/stores/friends";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

// Jeden wiersz na liście znajomych (otwiera szczegóły)
defineProps<{ friend: FriendRow }>();

const emit = defineEmits<{ open: [uid: string] }>();

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
</script>

<style scoped>
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
</style>
