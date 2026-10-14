<template>
	<section
		class="friends-section"
		aria-labelledby="list-title">
		<!-- ============ ZNAJOMI ============ -->
		<h3
			id="list-title"
			class="dt-section-title">
			Your friends <span class="dt-muted">· {{ friends.length }}</span>
		</h3>
		<ul class="friend-list">
			<li
				v-for="f in friends"
				:key="f.uid">
				<FriendsRow
					:friend="f"
					@open="emit('open', $event)" />
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
// Tylko typy — store znajomych ładuje rodzic (kod społecznościowy jest leniwy)
import type { FriendRow } from "@/stores/friends";
import FriendsRow from "@/components/friends/FriendsRow.vue";

// Lista znajomych; kliknięcie wiersza otwiera szczegóły
defineProps<{ friends: FriendRow[] }>();

const emit = defineEmits<{ open: [uid: string] }>();
</script>

<style scoped>
.friends-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.friend-list {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
</style>
