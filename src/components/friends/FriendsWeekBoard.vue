<template>
	<section
		class="dt-panel week"
		aria-labelledby="week-title">
		<!-- ============ TEN TYDZIEŃ ============ -->
		<div class="week-head">
			<h3
				id="week-title"
				class="dt-section-title">
				This week
			</h3>
			<span class="week-hint">goals done since Monday</span>
		</div>
		<p
			v-if="message"
			class="week-msg">
			{{ message }}
		</p>
		<ol class="podium">
			<li
				v-for="e in board"
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
</template>

<script setup lang="ts">
// Tylko typy — store znajomych ładuje rodzic (kod społecznościowy jest leniwy)
import type { BoardEntry } from "@/stores/friends";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";

// Tablica tygodnia: ranking celów od poniedziałku
defineProps<{
	board: BoardEntry[];
	message: string;
	// Ilu znajomych ukrywa swój tydzień
	privateCount: number;
}>();

const MEDALS = ["🥇", "🥈", "🥉"];
</script>

<style scoped>
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
</style>
