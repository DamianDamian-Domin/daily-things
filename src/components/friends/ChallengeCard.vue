<template>
	<article
		class="ch"
		:class="{ 'is-invite': row.isInvite, 'is-finished': row.phase === 'finished' }"
		:aria-labelledby="`ch-title-${row.challenge.id}`">
		<!-- ============ NAGŁÓWEK ============ -->
		<div class="ch-head">
			<span class="ch-icon">
				<PixelIcon
					:icon="row.challenge.icon"
					:palette="row.challenge.palette"
					:size="30" />
			</span>
			<div class="ch-id">
				<h4
					:id="`ch-title-${row.challenge.id}`"
					class="ch-title">
					{{ row.challenge.title }}
				</h4>
				<p class="ch-meta">
					{{ row.isInvite ? `${row.challenge.days} days · from ${row.invitedBy}` : row.label }}
				</p>
			</div>
			<button
				v-if="!row.isInvite && !confirmLeave"
				type="button"
				class="dt-icon-btn ch-more"
				:aria-label="`Leave ${row.challenge.title}`"
				v-tooltip.top="'Leave challenge'"
				@click="confirmLeave = true">
				<i
					class="pi pi-sign-out"
					aria-hidden="true"></i>
			</button>
		</div>

		<!-- ============ ZAPROSZENIE ============ -->
		<template v-if="row.isInvite">
			<p class="ch-invite-text">
				{{ row.invitedBy }} wants to do this together:
				<strong>{{ row.challenge.days }} days</strong>, check in once a day.
			</p>
			<ul class="ch-faces">
				<li
					v-for="m in row.members"
					:key="m.uid"
					:class="{ pending: !m.joined }"
					v-tooltip.top="m.joined ? m.name : `${m.name} (invited)`">
					<PixelAvatar
						:avatar="m.avatar"
						:size="32" />
					<span class="sr-only">{{ m.name }}{{ m.joined ? "" : " (invited)" }}</span>
				</li>
			</ul>
			<div class="ch-actions">
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					:disabled="busy"
					@click="emit('leave', row)">
					Not now
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-primary dt-btn-sm"
					:disabled="busy"
					@click="emit('join', row)">
					Join challenge
				</button>
			</div>
		</template>

		<!-- ============ POSTĘP ============ -->
		<template v-else>
			<div class="ch-team">
				<div class="ch-team-row">
					<span class="ch-team-msg">{{ row.message }}</span>
					<span class="ch-team-pct">{{ row.progress.pct }}%</span>
				</div>
				<span
					class="ch-bar"
					role="progressbar"
					:aria-valuenow="row.progress.pct"
					aria-valuemin="0"
					aria-valuemax="100"
					:aria-label="`Team progress: ${row.progress.done} of ${row.progress.total} days`">
					<span
						class="ch-bar-fill"
						:style="{ width: row.progress.done ? `max(${row.progress.pct}%, 0.7rem)` : '0' }"></span>
					<span
						v-if="row.phase === 'active' && row.progress.expected < row.challenge.days"
						class="ch-bar-today"
						:style="{ left: `${(row.progress.expected / row.challenge.days) * 100}%` }"
						aria-hidden="true"></span>
				</span>
			</div>

			<ul class="ch-people">
				<li
					v-for="m in row.members"
					:key="m.uid"
					class="ch-person"
					:class="{ 'is-me': m.isMe, pending: !m.joined }">
					<PixelAvatar
						:avatar="m.avatar"
						:size="28" />
					<span class="ch-name">{{ m.name }}</span>
					<span
						v-if="!m.joined"
						class="ch-pending">
						invited
					</span>
					<template v-else>
						<span
							class="ch-dots"
							:class="{ dense: row.challenge.days > 7 }"
							:style="{ gridTemplateColumns: `repeat(${Math.min(row.challenge.days, 15)}, minmax(0, ${row.challenge.days > 7 ? 0.5 : 0.7}rem))` }"
							aria-hidden="true">
							<span
								v-for="(on, i) in m.marks"
								:key="i"
								class="ch-dot"
								:class="{ on, today: i === row.progress.expected - 1 && row.phase === 'active' }"></span>
						</span>
						<span class="ch-count">{{ m.count }}/{{ row.challenge.days }}</span>
						<span class="sr-only">{{ m.name }}: {{ m.count }} of {{ row.challenge.days }} days</span>
					</template>
				</li>
			</ul>

			<div
				v-if="row.checkable.length"
				class="ch-checks">
				<button
					v-for="c in row.checkable"
					:key="c.day"
					type="button"
					class="dt-btn dt-btn-sm ch-check"
					:class="c.done ? 'is-done' : c.label === 'Today' ? 'dt-btn-primary' : 'dt-btn-outline'"
					:aria-pressed="c.done"
					:disabled="isBusy(c.day)"
					@click="emit('toggle', row, c.day)">
					<i
						:class="c.done ? 'pi pi-check-circle' : 'pi pi-circle'"
						aria-hidden="true"></i>
					{{ c.label === "Today" ? (c.done ? "Done today" : "I did it today") : c.done ? "Yesterday ✓" : "Yesterday" }}
				</button>
			</div>
		</template>

		<!-- ============ WYJŚCIE ============ -->
		<div
			v-if="confirmLeave"
			class="ch-confirm"
			role="group"
			aria-label="Confirm leaving the challenge">
			<span>Leave “{{ row.challenge.title }}”? Your check-ins go too.</span>
			<span class="ch-confirm-btns">
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="confirmLeave = false">
					Stay
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-danger dt-btn-sm"
					:disabled="busy"
					@click="emit('leave', row)">
					Leave
				</button>
			</span>
		</div>
	</article>
</template>

<script setup lang="ts">
import { ref } from "vue";
// Tylko typy — magazyn ładuje rodzic (kod społecznościowy jest leniwy)
import type { ChallengeRow } from "@/stores/challenges";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const props = defineProps<{
	row: ChallengeRow;
	busy: boolean;
	busyDays: string[];
}>();

const emit = defineEmits<{
	join: [row: ChallengeRow];
	leave: [row: ChallengeRow];
	toggle: [row: ChallengeRow, day: string];
}>();

const confirmLeave = ref(false);

function isBusy(day: string) {
	return props.busyDays.includes(day);
}
</script>

<style scoped>
.ch {
	display: flex;
	flex-direction: column;
	gap: 0.7rem;
	padding: 0.8rem 0.85rem 0.85rem;
	border-radius: var(--dt-radius-lg);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	box-shadow: var(--dt-shadow-sm);
}
.ch.is-invite {
	border-color: color-mix(in srgb, var(--dt-accent) 45%, var(--dt-border));
	background: linear-gradient(135deg, var(--dt-accent-softer), var(--dt-surface) 70%);
}
.ch.is-finished {
	background: var(--dt-surface-soft);
}
.ch-head {
	display: flex;
	align-items: center;
	gap: 0.65rem;
}
.ch-icon {
	display: grid;
	place-items: center;
	flex: 0 0 auto;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 0.8rem;
	background: var(--dt-surface-sunken);
}
.ch-id {
	flex: 1;
	min-width: 0;
}
.ch-title {
	margin: 0;
	font-size: var(--dt-text-md);
	font-weight: 700;
	color: var(--dt-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ch-meta {
	margin: 0.1rem 0 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
	font-weight: 600;
}
.ch-more {
	flex: 0 0 auto;
}
.ch-invite-text {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
	line-height: 1.45;
}
.ch-faces {
	display: flex;
	gap: 0.3rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.ch-faces li.pending,
.ch-person.pending :deep(svg),
.ch-person.pending :deep(img) {
	opacity: 0.55;
}
.ch-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}

/* Wspólny pasek */
.ch-team {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}
.ch-team-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.5rem;
}
.ch-team-msg {
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
}
.ch-team-pct {
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-accent-ink);
	font-variant-numeric: tabular-nums;
}
.ch-bar {
	position: relative;
	display: block;
	height: 0.7rem;
	border-radius: 999px;
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.ch-bar-fill {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, color-mix(in srgb, var(--dt-accent) 70%, #f3c64f), var(--dt-accent));
	transition: width 0.5s var(--dt-ease);
}
.is-finished .ch-bar-fill {
	background: linear-gradient(90deg, #f3c64f, var(--dt-gold));
}
/* Gdzie „powinniśmy” być dziś */
.ch-bar-today {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 2px;
	margin-left: -1px;
	background: color-mix(in srgb, var(--dt-text) 35%, transparent);
}

/* Uczestnicy */
.ch-people {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.ch-person {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-height: 2rem;
}
.ch-name {
	flex: 0 1 4.75rem;
	min-width: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text-2);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ch-person.is-me .ch-name {
	color: var(--dt-text);
	font-weight: 700;
}
.ch-pending {
	margin-left: auto;
	font-size: var(--dt-text-xs);
	font-style: italic;
	color: var(--dt-text-3);
}
.ch-dots {
	flex: 1;
	display: grid;
	gap: 0.25rem;
	min-width: 0;
}
.ch-dot {
	width: 100%;
	aspect-ratio: 1;
	border-radius: 0.22rem;
	background: var(--dt-surface-sunken);
	border: 1px solid var(--dt-border-strong);
}
.ch-dots.dense {
	gap: 0.15rem;
}
.ch-dots.dense .ch-dot {
	border-radius: 0.14rem;
}
.ch-dot.on {
	background: var(--dt-success-fill);
	border-color: var(--dt-success-fill);
}
.ch-dot.today:not(.on) {
	border-color: var(--dt-accent);
	border-style: dashed;
}
.ch-count {
	flex: 0 0 auto;
	min-width: 2.4rem;
	text-align: right;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-3);
	font-variant-numeric: tabular-nums;
}

/* Odhaczanie */
.ch-checks {
	display: flex;
	flex-direction: row-reverse;
	gap: 0.5rem;
}
.ch-check {
	flex: 1;
	justify-content: center;
}
.ch-check.is-done {
	background: var(--dt-success-soft);
	color: var(--dt-success);
	border: 1px solid color-mix(in srgb, var(--dt-success) 30%, transparent);
}
.ch-confirm {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.4rem 0.6rem;
	padding-top: 0.6rem;
	border-top: 1px dashed var(--dt-border);
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.ch-confirm-btns {
	display: flex;
	gap: 0.4rem;
	margin-left: auto;
}
</style>
