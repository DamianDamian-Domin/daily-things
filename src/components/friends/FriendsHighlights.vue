<template>
	<!-- ============ CHWILE DO ŚWIĘTOWANIA ============ -->
	<section
		class="moments"
		:aria-label="m.winsAria">
		<ul>
			<li
				v-for="h in friendsStore.highlights"
				:key="h.friend.uid + h.kind"
				class="moment">
				<PixelIcon
					:icon="h.icon"
					:palette="h.palette"
					:size="26" />
				<span class="moment-text">{{ h.text }}</span>
				<button
					type="button"
					class="dt-btn dt-btn-soft dt-btn-sm"
					:disabled="friendsStore.hasCheeredToday(h.friend.uid)"
					:aria-label="m.highFiveAria(h.friend.name)"
					@click="friendsStore.cheer(h.friend)">
					{{ friendsStore.hasCheeredToday(h.friend.uid) ? m.sent : "👏" }}
				</button>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import { useFriendsStore } from "@/stores/friends";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { friendsMessages as m } from "@/i18n/messages/friends";

const friendsStore = useFriendsStore();
</script>

<style scoped>
.moments ul {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.moment {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.45rem 0.5rem 0.45rem 0.65rem;
	border-radius: var(--dt-radius);
	border: 1px solid color-mix(in srgb, var(--dt-gold) 35%, var(--dt-border));
	background: linear-gradient(90deg, color-mix(in srgb, var(--dt-gold) 14%, var(--dt-surface)), var(--dt-surface));
}
.moment-text {
	flex: 1;
	min-width: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
}
</style>
