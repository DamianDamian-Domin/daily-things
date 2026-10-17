<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'recap-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog insights-dialog">
		<div class="ins">
			<div class="recap-hero">
				<div class="recap-nav">
					<button
						type="button"
						class="dt-icon-btn"
						aria-label="Previous week"
						@click="offset--">
						<i
							class="pi pi-chevron-left"
							aria-hidden="true"></i>
					</button>
					<p
						class="recap-range"
						aria-live="polite">
						{{ rangeLabel }}
					</p>
					<button
						type="button"
						class="dt-icon-btn"
						aria-label="Next week"
						:disabled="offset >= 0"
						@click="offset++">
						<i
							class="pi pi-chevron-right"
							aria-hidden="true"></i>
					</button>
					<button
						type="button"
						class="dt-icon-btn recap-close"
						aria-label="Close"
						@click="visible = false">
						<i
							class="pi pi-times"
							aria-hidden="true"></i>
					</button>
				</div>
				<p class="recap-kicker">{{ offset === 0 ? "This week so far" : "Your week in review" }}</p>
				<h2
					id="recap-title"
					class="recap-headline">
					{{ recap.headline }}
				</h2>
			</div>

			<dl class="recap-kpis">
				<div class="recap-kpi">
					<PixelIcon
						icon="check_circle"
						palette="green"
						:size="28" />
					<dd>{{ recap.checkIns }}</dd>
					<dt>habits logged</dt>
					<span
						v-if="recap.deltaPct !== null && recap.deltaPct !== 0"
						class="recap-delta"
						:class="{ down: recap.deltaPct < 0 }"
						>{{ recap.deltaPct > 0 ? "▲" : "▼" }} {{ Math.abs(recap.deltaPct) }}% vs last week</span
					>
				</div>
				<div class="recap-kpi">
					<PixelIcon
						icon="target"
						palette="orange"
						:size="28" />
					<dd>{{ recap.goalPct === null ? "—" : `${recap.goalPct}%` }}</dd>
					<dt>of daily goals</dt>
				</div>
				<div class="recap-kpi">
					<PixelIcon
						icon="star_shine"
						palette="yellow"
						:size="28" />
					<dd>{{ recap.perfectDays }}<small>/{{ recap.elapsedDays }}</small></dd>
					<dt>perfect days</dt>
				</div>
			</dl>

			<section
				class="recap-section"
				aria-label="Day by day">
				<div
					class="recap-bars"
					role="img"
					:aria-label="barsAria">
					<div
						v-for="d in bars"
						:key="d.key"
						class="recap-col"
						:class="{ perfect: d.perfect, best: d.best, future: d.future }">
						<span class="recap-track">
							<span
								class="recap-fill"
								:style="{ height: `${d.height}%` }"></span>
						</span>
						<span class="recap-day">{{ d.short }}</span>
					</div>
				</div>
			</section>

			<RecapMood
				:start="range.start"
				:end="range.end" />

			<ul class="recap-highlights">
				<li v-if="recap.bestDay">
					<PixelIcon
						icon="trophy"
						palette="yellow"
						:size="26" />
					<span
						>Best day: <strong>{{ recap.bestDay.weekday }}</strong>
						<small>{{ bestDayDetail }}</small></span
					>
				</li>
				<li v-if="recap.top.length">
					<PixelIcon
						:icon="recap.top[0].habit.icon"
						:palette="paletteFor(recap.top[0].habit)"
						:size="26" />
					<span
						>Top habit: <strong>{{ displayName(recap.top[0].habit) }}</strong>
						<small>{{ recap.top[0].count }}× this week</small></span
					>
				</li>
				<li
					v-for="w in weeklyRoutine"
					:key="`weekly-${w.name}`">
					<PixelIcon
						:icon="w.habit.icon"
						:palette="paletteFor(w.habit)"
						:size="26" />
					<span
						>Weekly goal: <strong>{{ displayName(w.habit) }}</strong>
						<small
							>{{ Math.min(w.done, w.target) }}/{{ w.target }} this week{{
								w.done >= w.target ? " ✓" : ""
							}}</small
						></span
					>
				</li>
				<li v-if="habitsStore.streak > 1 && offset >= -1">
					<PixelIcon
						icon="local_fire_department"
						palette="orange"
						:size="26" />
					<span
						>Streak: <strong>{{ habitsStore.streak }} days</strong>
						<small v-if="frozenInWeek">one free pass used ❄️</small></span
					>
				</li>
				<li
					v-for="b in newBadges.slice(0, 3)"
					:key="b.id">
					<PixelIcon
						:icon="b.icon"
						:palette="b.palette"
						:size="26" />
					<span
						>New badge: <strong>{{ b.title }}</strong> <small>{{ b.description }}</small></span
					>
				</li>
				<li v-if="newBadges.length > 3">
					<PixelIcon
						icon="trophy"
						palette="yellow"
						:size="26" />
					<span>…and {{ newBadges.length - 3 }} more new badges</span>
				</li>
			</ul>

			<p class="recap-tip">
				<span aria-hidden="true">💡</span>
				{{ recap.tip }}
			</p>

			<div class="recap-actions">
				<button
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="insights.open('badges')">
					See badges
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-primary dt-btn-sm"
					:disabled="recap.empty"
					@click="share">
					<i
						class="pi pi-share-alt"
						aria-hidden="true"></i>
					Share my week
				</button>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import Dialog from "primevue/dialog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import RecapMood from "@/components/insights/RecapMood.vue";
import { useAchievementsStore } from "@/stores/achievements";
import { useHabitsStore } from "@/stores/habits";
import { useInsightsStore } from "@/stores/insights";
import { useToastStore } from "@/stores/toast";
import { addDays, daysInRange, formatShortDate, startOfDay, startOfWeek, toDateKey, weekdayName } from "@/utils/date";
import { displayName, isNegative, paletteFor } from "@/utils/habitCatalog";
import { buildRecap, recapShareText, type RecapDay } from "@/utils/weeklyRecap";

const visible = defineModel<boolean>({ default: false });
const habitsStore = useHabitsStore();
const achievements = useAchievementsStore();
const insights = useInsightsStore();
const toast = useToastStore();

const offset = computed({
	get: () => insights.recapOffset,
	set: (v: number) => (insights.recapOffset = Math.min(0, v)),
});

const range = computed(() => {
	const start = addDays(startOfWeek(startOfDay()), offset.value * 7);
	return { start, end: addDays(start, 6) };
});

// Bieżący + poprzedni tydzień (do porównania)
watch(
	range,
	({ start, end }) => habitsStore.ensureRange(addDays(start, -7), end),
	{ immediate: true },
);

const rangeLabel = computed(
	() => `${formatShortDate(range.value.start)} – ${formatShortDate(range.value.end)}`,
);

function recapDay(date: Date): RecapDay {
	const key = toDateKey(date);
	const logs = habitsStore.logsOn(key);
	const groups = habitsStore.groupLogs(logs);
	const goals = habitsStore.dayGoalsProgress(key);
	return {
		key,
		weekday: weekdayName(date, "long"),
		short: weekdayName(date, "short").slice(0, 2),
		future: key > habitsStore.todayKey,
		checkIns: groups.filter((g) => !isNegative(g.habit)).reduce((n, g) => n + g.count, 0),
		goalsDone: goals.done,
		goalsTotal: goals.total,
		perfect: goals.perfect,
		habits: groups,
	};
}

const days = computed(() => daysInRange(range.value.start, range.value.end).map(recapDay));

// Bieżący tydzień porównujemy z tyloma samymi dniami poprzedniego
const previous = computed(() => {
	const elapsed = days.value.filter((d) => !d.future).length;
	const prev = daysInRange(addDays(range.value.start, -7), addDays(range.value.start, elapsed - 8)).map(recapDay);
	return prev.reduce(
		(acc, d) => ({
			checkIns: acc.checkIns + d.checkIns,
			goalsDone: acc.goalsDone + d.goalsDone,
			goalsTotal: acc.goalsTotal + d.goalsTotal,
		}),
		{ checkIns: 0, goalsDone: 0, goalsTotal: 0 },
	);
});

const recap = computed(() =>
	buildRecap({
		days: days.value,
		previous: previous.value,
		streak: habitsStore.streak,
		label: rangeLabel.value,
	}),
);

// Cele „N× w tygodniu” — stan na ostatni miniony dzień tego tygodnia
const weeklyRoutine = computed(() => {
	const endKey = toDateKey(range.value.end);
	const key = endKey > habitsStore.todayKey ? habitsStore.todayKey : endKey;
	return habitsStore.weeklyGoalsFor(key);
});

const bars = computed(() => {
	const maxCheckIns = Math.max(1, ...days.value.map((d) => d.checkIns));
	return days.value.map((d) => {
		// Z celami: % celów; bez celów: liczba odhaczeń względem najlepszego dnia
		const ratio = d.goalsTotal ? d.goalsDone / d.goalsTotal : d.checkIns / maxCheckIns;
		return {
			...d,
			best: recap.value.bestDay?.key === d.key,
			height: d.future ? 0 : ratio > 0 ? Math.max(8, Math.round(ratio * 100)) : 0,
		};
	});
});

const barsAria = computed(
	() =>
		"Day by day: " +
		days.value
			.filter((d) => !d.future)
			.map((d) =>
				d.goalsTotal
					? `${d.weekday} ${d.goalsDone} of ${d.goalsTotal} goals`
					: `${d.weekday} ${d.checkIns} logged`,
			)
			.join(", "),
);

const bestDayDetail = computed(() => {
	const d = recap.value.bestDay;
	if (!d) return "";
	if (d.perfect) return "every goal done 🏅";
	if (d.goalsTotal) return `${d.goalsDone}/${d.goalsTotal} goals`;
	return `${d.checkIns} habits`;
});

const frozenInWeek = computed(() => {
	const from = toDateKey(range.value.start);
	const to = toDateKey(range.value.end);
	return habitsStore.streakInfo.frozen.some((k) => k >= from && k <= to);
});

const newBadges = computed(() =>
	achievements.unlockedBetween(range.value.start.getTime(), addDays(range.value.end, 1).getTime()),
);

async function share() {
	const text = recapShareText(recap.value, rangeLabel.value, habitsStore.streak);
	try {
		if (navigator.share) {
			await navigator.share({ text });
			return;
		}
		await navigator.clipboard.writeText(text);
		toast.show("Copied your week — paste it anywhere 📋", { tone: "success" });
	} catch (err) {
		// Zamknięcie arkusza udostępniania to nie błąd
		if ((err as DOMException)?.name === "AbortError") return;
		toast.error("Couldn't share right now — try again.");
	}
}
</script>

<style scoped>
.ins {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-height: min(88dvh, 48rem);
	padding: 0 0 1.25rem;
	overflow-y: auto;
}
.ins > :not(.recap-hero) {
	margin-inline: 1.25rem;
}
.recap-hero {
	padding: 0.75rem 1rem 1.1rem;
	text-align: center;
	background:
		radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--dt-gold) 30%, transparent), transparent 70%),
		linear-gradient(180deg, var(--dt-accent-soft), var(--dt-surface));
	border-bottom: 1px solid var(--dt-border);
}
.recap-nav {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	position: relative;
}
.recap-close {
	position: absolute;
	right: 0;
}
.recap-range {
	min-width: 9rem;
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text-2);
}
.recap-kicker {
	margin: 0.6rem 0 0.1rem;
	font-family: var(--dt-font-script);
	font-size: 1.7rem;
	line-height: 1;
	color: var(--dt-accent-ink);
}
.recap-headline {
	margin: 0;
	font-size: var(--dt-text-xl);
	font-weight: 700;
	color: var(--dt-text);
}
.recap-kpis {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin: 0;
}
.recap-kpi {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.15rem;
	padding: 0.7rem 0.4rem;
	text-align: center;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.recap-kpi dd {
	margin: 0.1rem 0 0;
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.1;
	color: var(--dt-text);
}
.recap-kpi dd small {
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text-3);
}
.recap-kpi dt {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-2);
}
.recap-delta {
	font-size: 0.7rem;
	font-weight: 700;
	color: var(--dt-success);
}
.recap-delta.down {
	color: var(--dt-text-3);
}
.recap-bars {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.4rem;
	padding: 0.7rem 0.6rem 0.5rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.recap-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
}
.recap-track {
	position: relative;
	display: block;
	width: 100%;
	max-width: 1.8rem;
	height: 5rem;
	border-radius: 0.5rem;
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.recap-fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	border-radius: 0.5rem;
	background: linear-gradient(180deg, color-mix(in srgb, var(--dt-accent) 70%, #f3c64f), var(--dt-accent));
	transition: height 0.5s var(--dt-ease);
}
.recap-col.perfect .recap-fill {
	background: linear-gradient(180deg, #f3c64f, var(--dt-gold));
}
.recap-col.best .recap-track {
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--dt-gold) 70%, transparent);
}
.recap-col.future {
	opacity: 0.45;
}
.recap-day {
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-3);
}
.recap-highlights {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-block: 0;
	padding: 0;
	list-style: none;
}
.recap-highlights li {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text);
}
.recap-highlights small {
	display: block;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.recap-tip {
	margin-block: 0;
	padding: 0.7rem 0.85rem;
	font-size: var(--dt-text-sm);
	line-height: 1.4;
	color: var(--dt-text-2);
	border-radius: var(--dt-radius);
	background: var(--dt-accent-softer);
	border: 1px solid var(--dt-border);
}
.recap-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}
.recap-actions .pi {
	margin-right: 0.35rem;
	font-size: 0.85em;
}
</style>
