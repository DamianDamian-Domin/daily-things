<template>
	<section
		class="friends-section"
		aria-labelledby="requests-title">
		<!-- ============ ZAPROSZENIA ============ -->
		<h3
			id="requests-title"
			class="dt-section-title">
			{{ m.requests }}
		</h3>
		<ul class="req-list">
			<li
				v-for="r in incoming"
				:key="r.pairId"
				class="req-row is-incoming">
				<PixelAvatar
					:avatar="r.avatar"
					:size="40" />
				<span class="req-text">
					<strong>{{ r.name }}</strong>
					<span>{{ m.wantsToBeFriends }}</span>
				</span>
				<button
					type="button"
					class="dt-btn dt-btn-primary dt-btn-sm"
					:aria-label="m.acceptAria(r.name)"
					@click="emit('accept', r)">
					{{ m.accept }}
				</button>
				<button
					type="button"
					class="dt-icon-btn"
					:aria-label="m.declineAria(r.name)"
					@click="emit('decline', r)">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</li>
			<li
				v-for="r in outgoing"
				:key="r.pairId"
				class="req-row">
				<PixelAvatar
					:avatar="r.avatar"
					:size="40" />
				<span class="req-text">
					<strong>{{ r.name }}</strong>
					<span>{{ m.requestPending }}</span>
				</span>
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					:aria-label="m.cancelAria(r.name)"
					@click="emit('cancel', r)">
					{{ c.cancel }}
				</button>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
// Tylko typy — store znajomych ładuje rodzic (kod społecznościowy jest leniwy)
import type { RequestRow } from "@/stores/friends";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { friendsMessages as m } from "@/i18n/messages/friends";
import { commonMessages as c } from "@/i18n/messages/common";

// Zaproszenia: przychodzące (przyjmij/odrzuć) i wysłane (anuluj)
defineProps<{ incoming: RequestRow[]; outgoing: RequestRow[] }>();

const emit = defineEmits<{
	accept: [row: RequestRow];
	decline: [row: RequestRow];
	cancel: [row: RequestRow];
}>();
</script>

<style scoped>
.friends-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.req-list {
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
</style>
