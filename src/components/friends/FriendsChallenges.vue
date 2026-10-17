<template>
	<section
		class="challenges"
		aria-labelledby="challenges-title">
		<!-- ============ WYZWANIA ============ -->
		<div class="challenges-head">
			<h3
				id="challenges-title"
				class="dt-section-title">
				Challenges
			</h3>
			<button
				v-if="store.rows.length"
				type="button"
				class="dt-btn dt-btn-soft dt-btn-sm"
				@click="emit('create')">
				<i
					class="pi pi-plus"
					aria-hidden="true"></i>
				New
			</button>
		</div>

		<div
			v-if="store.rows.length"
			class="challenges-list">
			<ChallengeCard
				v-for="row in store.rows"
				:key="row.challenge.id"
				:row="row"
				:busy="store.isBusy(row.challenge.id)"
				:busy-days="busyDays(row)"
				@join="store.join"
				@leave="store.leave"
				@toggle="store.toggle" />
		</div>

		<!-- Jeszcze nic — zachęta -->
		<button
			v-else
			type="button"
			class="challenges-empty"
			@click="emit('create')">
			<PixelIcon
				icon="flag"
				palette="green"
				:size="32" />
			<span class="challenges-empty-text">
				<strong>Start a challenge together</strong>
				<span>Like 7 days without sweets — one shared progress bar.</span>
			</span>
			<i
				class="pi pi-chevron-right"
				aria-hidden="true"></i>
		</button>
	</section>
</template>

<script setup lang="ts">
import { useChallengesStore, type ChallengeRow } from "@/stores/challenges";
import ChallengeCard from "@/components/friends/ChallengeCard.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const emit = defineEmits<{ create: [] }>();

const store = useChallengesStore();

function busyDays(row: ChallengeRow) {
	return row.checkable
		.filter((c) => store.isBusy(`${row.challenge.id}:${c.day}`))
		.map((c) => c.day);
}
</script>

<style scoped>
.challenges {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}
.challenges-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}
.challenges-list {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
}
.challenges-empty {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: var(--dt-radius-lg);
	border: 1px dashed var(--dt-border-strong);
	background: var(--dt-surface-soft);
	color: var(--dt-text-3);
	font: inherit;
	text-align: left;
	cursor: pointer;
	transition:
		background var(--dt-t-fast) var(--dt-ease),
		border-color var(--dt-t-fast) var(--dt-ease);
}
@media (hover: hover) {
	.challenges-empty:hover {
		background: var(--dt-hover-bg);
		border-color: var(--dt-hover-border);
	}
}
.challenges-empty:focus-visible {
	outline: none;
	box-shadow: var(--dt-focus-ring);
}
.challenges-empty-text {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
	font-size: var(--dt-text-sm);
	line-height: 1.35;
}
.challenges-empty-text strong {
	color: var(--dt-text);
}
</style>
