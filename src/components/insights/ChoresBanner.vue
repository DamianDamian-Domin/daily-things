<template>
	<Transition name="chores-banner">
		<section
			v-if="show"
			class="chores-banner"
			aria-labelledby="chores-banner-title">
			<div class="cb-head">
				<PixelIcon
					icon="cleaning_services"
					palette="blue"
					:size="28" />
				<h2
					id="chores-banner-title"
					class="cb-title">
					{{ title }}
				</h2>
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="insights.open('lastDone')">
					All chores
				</button>
				<button
					type="button"
					class="dt-icon-btn"
					aria-label="Hide until tomorrow"
					@click="dismiss">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>
			<ul class="cb-list">
				<li
					v-for="item in shown"
					:key="item.cycle.name"
					class="cb-item"
					:class="`is-${item.status.state}`">
					<button
						type="button"
						class="cb-open"
						:aria-label="`${displayName(item.habit)}, ${dueLabel(item.status)}. Show history`"
						@click="insights.open('lastDone', { habit: item.cycle.name })">
						<PixelIcon
							:icon="item.habit.icon"
							:palette="paletteFor(item.habit)"
							:size="22" />
						<span class="cb-name">{{ displayName(item.habit) }}</span>
						<span class="cb-due">{{ dueLabel(item.status) }}</span>
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm cb-done"
						:aria-label="`Mark ${displayName(item.habit)} done today`"
						@click="markDone(item)">
						<i
							class="pi pi-check"
							aria-hidden="true"></i>
						Done
					</button>
				</li>
			</ul>
			<p
				v-if="hidden"
				class="cb-more">
				+{{ hidden }} more
			</p>
		</section>
	</Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useAuthStore } from "@/stores/auth";
import { useCyclesStore, type CycleItem } from "@/stores/cycles";
import { useHabitsStore } from "@/stores/habits";
import { useInsightsStore } from "@/stores/insights";
import { useToastStore } from "@/stores/toast";
import { dueLabel } from "@/utils/cycles";
import { displayName, paletteFor } from "@/utils/habitCatalog";

// Obowiązki cykliczne na dziś i po terminie. Zamknięcie chowa baner do jutra
// (na tym urządzeniu) — powiadomienie i tak przypomni za kilka dni.
const LIMIT = 3;

const authStore = useAuthStore();
const cyclesStore = useCyclesStore();
const habitsStore = useHabitsStore();
const insights = useInsightsStore();
const toast = useToastStore();

const storageKey = computed(() => `dt-chores-hidden:${authStore.userUid ?? "anon"}`);
const hiddenOn = ref<string | null>(null);
watch(
	storageKey,
	(key) => {
		try {
			hiddenOn.value = localStorage.getItem(key);
		} catch {
			hiddenOn.value = null;
		}
	},
	{ immediate: true },
);

const due = computed(() => cyclesStore.dueItems);
const shown = computed(() => due.value.slice(0, LIMIT));
const hidden = computed(() => Math.max(0, due.value.length - LIMIT));
const show = computed(() => due.value.length > 0 && hiddenOn.value !== habitsStore.todayKey);

const title = computed(() => {
	const overdue = due.value.filter((i) => i.status.daysLeft < 0).length;
	const n = due.value.length;
	if (overdue === n) return n === 1 ? "A chore is overdue" : `${n} chores are overdue`;
	return n === 1 ? "A chore is due" : `${n} chores are due`;
});

function markDone(item: CycleItem) {
	const log = habitsStore.logHabit(item.habit, habitsStore.todayKey);
	if (!log) return;
	toast.undoable(`${displayName(item.habit)} done ✨`, () => habitsStore.removeLog(log.id, habitsStore.todayKey));
}

function dismiss() {
	hiddenOn.value = habitsStore.todayKey;
	try {
		localStorage.setItem(storageKey.value, habitsStore.todayKey);
	} catch {
		/* brak storage — baner wróci po odświeżeniu */
	}
}
</script>

<style scoped>
.chores-banner {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	width: min(100% - 1.5rem, 44rem);
	padding: 0.55rem 0.6rem 0.6rem 0.8rem;
	border-radius: var(--dt-radius-lg);
	border: 1px solid color-mix(in srgb, var(--dt-gold) 45%, var(--dt-border));
	background: linear-gradient(90deg, color-mix(in srgb, var(--dt-gold) 14%, var(--dt-surface)), var(--dt-surface));
	box-shadow: var(--dt-shadow-sm);
}
.cb-head {
	display: flex;
	align-items: center;
	gap: 0.6rem;
}
.cb-title {
	flex: 1;
	min-width: 0;
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 700;
	color: var(--dt-text);
}
.cb-head .dt-btn {
	flex-shrink: 0;
}
.cb-list {
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
	margin: 0;
	padding: 0;
}
.cb-item {
	--state: var(--dt-gold);
	display: flex;
	align-items: center;
	gap: 0.4rem;
	list-style: none;
}
.cb-item.is-overdue {
	--state: var(--dt-danger);
}
.cb-open {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	flex: 1;
	min-width: 0;
	padding: 0.25rem 0.35rem;
	border: 0;
	border-radius: var(--dt-radius-sm);
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}
.cb-open:focus-visible {
	outline: 2px solid var(--dt-focus);
}
.cb-name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
}
.cb-due {
	flex-shrink: 0;
	padding: 0.1rem 0.5rem;
	border-radius: var(--dt-radius-pill);
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: color-mix(in srgb, var(--state) 70%, var(--dt-text));
	background: color-mix(in srgb, var(--state) 16%, var(--dt-surface));
}
.cb-done {
	flex-shrink: 0;
}
.cb-more {
	margin: 0 0 0 0.35rem;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
@media (hover: hover) {
	.cb-open:hover {
		background: var(--dt-hover-bg);
	}
}
.chores-banner-enter-active,
.chores-banner-leave-active {
	transition:
		opacity var(--dt-t) var(--dt-ease),
		transform var(--dt-t) var(--dt-ease);
}
.chores-banner-enter-from,
.chores-banner-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>
