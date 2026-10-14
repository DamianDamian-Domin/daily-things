<template>
	<Transition name="recap-banner">
		<div
			v-if="show"
			class="recap-banner"
			role="status">
			<PixelIcon
				icon="celebration"
				palette="orange"
				:size="28" />
			<p>
				<strong>Your week recap is ready ✨</strong>
				<span>{{ teaser }}</span>
			</p>
			<button
				type="button"
				class="dt-btn dt-btn-primary dt-btn-sm"
				@click="openRecap">
				See recap
			</button>
			<button
				type="button"
				class="dt-icon-btn"
				aria-label="Dismiss"
				@click="dismiss">
				<i
					class="pi pi-times"
					aria-hidden="true"></i>
			</button>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useAuthStore } from "@/stores/auth";
import { useHabbitsStore } from "@/stores/habbits";
import { useInsightsStore } from "@/stores/insights";
import { useProfileStore } from "@/stores/profile";
import { addDays, daysInRange, fromDateKey, startOfWeek, toDateKey } from "@/utils/date";

// Baner w pierwszych dniach nowego tygodnia (pon–śr), raz na tydzień na urządzeniu,
// tylko gdy w poprzednim tygodniu cokolwiek się działo
const SHOW_UNTIL_WEEKDAY = 3; // środa

const authStore = useAuthStore();
const habbitsStore = useHabbitsStore();
const profileStore = useProfileStore();
const insights = useInsightsStore();

const lastWeekStart = computed(() => addDays(startOfWeek(fromDateKey(habbitsStore.todayKey)), -7));
const weekId = computed(() => toDateKey(lastWeekStart.value));
const storageKey = computed(() => `dt-recap-seen:${authStore.userUid ?? "anon"}`);

const seen = ref<string | null>(null);
watch(
	storageKey,
	(key) => {
		try {
			seen.value = localStorage.getItem(key);
		} catch {
			seen.value = null;
		}
	},
	{ immediate: true },
);

const lastWeekLogs = computed(() =>
	daysInRange(lastWeekStart.value, addDays(lastWeekStart.value, 6)).reduce(
		(n, d) => n + habbitsStore.logsOn(toDateKey(d)).length,
		0,
	),
);

const show = computed(() => {
	const weekday = (fromDateKey(habbitsStore.todayKey).getDay() + 6) % 7; // 0 = pon
	return (
		profileStore.ready &&
		weekday < SHOW_UNTIL_WEEKDAY &&
		seen.value !== weekId.value &&
		lastWeekLogs.value > 0
	);
});

const teaser = computed(() => `${lastWeekLogs.value} habits logged last week`);

function markSeen() {
	seen.value = weekId.value;
	try {
		localStorage.setItem(storageKey.value, weekId.value);
	} catch {
		/* brak storage — baner wróci po odświeżeniu */
	}
}

function openRecap() {
	markSeen();
	insights.open("recap", { recapOffset: -1 });
}

function dismiss() {
	markSeen();
}
</script>

<style scoped>
.recap-banner {
	display: flex;
	align-items: center;
	gap: 0.7rem;
	width: min(100% - 1.5rem, 44rem);
	padding: 0.55rem 0.6rem 0.55rem 0.8rem;
	border-radius: var(--dt-radius-lg);
	border: 1px solid color-mix(in srgb, var(--dt-accent) 35%, var(--dt-border));
	background: linear-gradient(90deg, var(--dt-accent-soft), var(--dt-surface));
	box-shadow: var(--dt-shadow-sm);
}
.recap-banner p {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
}
.recap-banner p span {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
}
.recap-banner .dt-btn {
	flex-shrink: 0;
}
.recap-banner-enter-active,
.recap-banner-leave-active {
	transition:
		opacity var(--dt-t) var(--dt-ease),
		transform var(--dt-t) var(--dt-ease);
}
.recap-banner-enter-from,
.recap-banner-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>
