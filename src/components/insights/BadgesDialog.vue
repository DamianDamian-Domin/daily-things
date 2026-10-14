<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'badges-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog insights-dialog">
		<div class="ins">
			<div class="ins-head">
				<PixelIcon
					icon="trophy"
					palette="yellow"
					:size="40" />
				<div class="ins-head-text">
					<h2
						id="badges-title"
						class="dt-title">
						Your badges
					</h2>
					<p class="dt-subtitle">{{ earnedCount }} of {{ items.length }} collected</p>
				</div>
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Close"
					@click="visible = false">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>

			<div
				class="badge-meter"
				role="progressbar"
				:aria-valuenow="earnedCount"
				aria-valuemin="0"
				:aria-valuemax="items.length"
				aria-label="Badges collected">
				<span :style="{ width: `${Math.round((earnedCount / items.length) * 100)}%` }"></span>
			</div>

			<ul class="badge-grid">
				<li
					v-for="item in items"
					:key="item.def.id"
					class="badge"
					:class="{ earned: item.earned }">
					<span class="badge-medal">
						<PixelIcon
							:icon="item.def.icon"
							:palette="item.def.palette"
							:muted="!item.earned"
							:size="36" />
						<span
							v-if="!item.earned"
							class="badge-lock"
							aria-hidden="true">
							<i class="pi pi-lock"></i>
						</span>
					</span>
					<span class="badge-title">{{ item.def.title }}</span>
					<span class="badge-desc">{{ item.def.description }}</span>
					<span
						v-if="item.earned"
						class="badge-when"
						>{{ item.when }}</span
					>
					<span
						v-else-if="item.progress.target > 1"
						class="badge-progress"
						:aria-label="`${item.progress.current} of ${item.progress.target}`">
						<span class="badge-track"
							><span :style="{ width: `${item.progress.pct}%` }"></span
						></span>
						{{ item.progress.current }}/{{ item.progress.target }}
					</span>
				</li>
			</ul>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { EARNED_EARLIER, useAchievementsStore } from "@/stores/achievements";
import { progressOf } from "@/utils/achievements";
import { formatShortDate } from "@/utils/date";

const visible = defineModel<boolean>({ default: false });
const achievements = useAchievementsStore();

// Zdobyte na górze (najnowsze pierwsze), potem najbliższe zdobycia
const items = computed(() =>
	achievements.list
		.map(({ def, unlockedAt }) => ({
			def,
			earned: unlockedAt !== null,
			unlockedAt: unlockedAt ?? 0,
			when:
				unlockedAt === EARNED_EARLIER
					? "Earned"
					: unlockedAt
						? `Earned ${formatShortDate(new Date(unlockedAt))}`
						: "",
			progress: progressOf(def, achievements.metrics),
		}))
		.sort(
			(a, b) =>
				Number(b.earned) - Number(a.earned) ||
				b.unlockedAt - a.unlockedAt ||
				b.progress.pct - a.progress.pct,
		),
);

const earnedCount = computed(() => items.value.filter((i) => i.earned).length);
</script>

<style scoped>
.ins {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-height: min(86dvh, 46rem);
	padding: 1.1rem 1.25rem 1.25rem;
	overflow-y: auto;
}
.ins-head {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}
.ins-head-text {
	flex: 1;
	min-width: 0;
}
.badge-meter {
	height: 0.55rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.badge-meter span {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, #f3c64f, var(--dt-gold));
	transition: width 0.5s var(--dt-ease);
}
.badge-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
	gap: 0.6rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.badge {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.85rem 0.6rem 0.75rem;
	text-align: center;
	border-radius: var(--dt-radius-lg);
	border: 1px dashed var(--dt-border-strong);
	background: var(--dt-surface-soft);
}
.badge.earned {
	border: 1px solid color-mix(in srgb, var(--dt-gold) 45%, var(--dt-border));
	background: linear-gradient(180deg, color-mix(in srgb, var(--dt-gold) 14%, var(--dt-surface)), var(--dt-surface));
	box-shadow: var(--dt-shadow-sm);
}
.badge-medal {
	position: relative;
	display: grid;
	place-items: center;
	width: 3.4rem;
	height: 3.4rem;
	margin-bottom: 0.2rem;
	border-radius: 50%;
	background: var(--dt-surface-sunken);
}
.badge.earned .badge-medal {
	background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--dt-gold) 12%, var(--dt-surface)), color-mix(in srgb, var(--dt-gold) 40%, var(--dt-surface)));
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dt-gold) 60%, transparent);
}
.badge-lock {
	position: absolute;
	right: -0.1rem;
	bottom: -0.1rem;
	display: grid;
	place-items: center;
	width: 1.3rem;
	height: 1.3rem;
	border-radius: 50%;
	font-size: 0.6rem;
	color: var(--dt-text-3);
	background: var(--dt-surface);
	border: 1px solid var(--dt-border);
}
.badge-title {
	font-weight: 700;
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
}
.badge-desc {
	font-size: var(--dt-text-xs);
	line-height: 1.3;
	color: var(--dt-text-2);
}
.badge-when {
	margin-top: 0.15rem;
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-accent-ink);
}
.badge-progress {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	width: 100%;
	margin-top: 0.2rem;
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-3);
}
.badge-track {
	flex: 1;
	height: 0.35rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.badge-track span {
	display: block;
	height: 100%;
	background: var(--dt-accent);
}
</style>

<style>
.insights-dialog.p-dialog {
	width: min(94vw, 34rem);
}
</style>
