<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'last-done-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog insights-dialog last-done-dialog"
		@show="onShow">
		<div class="ins">
			<div class="ins-head">
				<PixelIcon
					icon="schedule"
					palette="blue"
					:size="40" />
				<div class="ins-head-text">
					<h2
						id="last-done-title"
						class="dt-title">
						When did I last…?
					</h2>
					<p class="dt-subtitle">Look up any habit you've logged</p>
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

			<div class="ld-search">
				<i
					class="pi pi-search"
					aria-hidden="true"></i>
				<input
					ref="searchRef"
					v-model="query"
					type="search"
					class="dt-input"
					placeholder="e.g. clean the fridge, filter"
					aria-label="Search your habits"
					autocomplete="off"
					spellcheck="false"
					@keydown.enter.prevent="openFirst" />
			</div>

			<div class="ld-toolbar">
				<p
					class="ld-count"
					aria-live="polite">
					{{ countLabel }}
				</p>
				<div
					class="dt-segmented"
					role="group"
					aria-label="Sort">
					<button
						type="button"
						:aria-pressed="sort === 'recent'"
						@click="sort = 'recent'">
						Recent
					</button>
					<button
						type="button"
						:aria-pressed="sort === 'oldest'"
						@click="sort = 'oldest'">
						Longest ago
					</button>
				</div>
			</div>

			<div class="ld-scroll">
				<template v-if="chores.length">
					<h3 class="dt-section-title ld-section-title">
						Repeating chores
						<span
							v-if="dueCount"
							class="ld-section-badge"
							>{{ dueCount }} due</span
						>
					</h3>
					<ul class="ld-list">
						<LastDoneRow
							v-for="row in chores"
							:key="row.name"
							:row="row"
							:open="expanded === row.name"
							:today-key="habitsStore.todayKey"
							:data-habit="row.name"
							@toggle="toggle(row.name)"
							@open-day="openDay"
							@log-today="logToday(row)"
							@set-cycle="(every, unit) => setCycle(row, every, unit)" />
					</ul>
					<h3
						v-if="logged.length"
						class="dt-section-title ld-section-title">
						Everything else
					</h3>
				</template>
				<ul
					v-if="logged.length"
					class="ld-list">
					<LastDoneRow
						v-for="row in logged"
						:key="row.name"
						:row="row"
						:open="expanded === row.name"
						:today-key="habitsStore.todayKey"
						:data-habit="row.name"
						@toggle="toggle(row.name)"
						@open-day="openDay"
						@log-today="logToday(row)"
						@set-cycle="(every, unit) => setCycle(row, every, unit)" />
				</ul>

				<template v-if="never.length">
					<h3 class="dt-section-title ld-never-title">Never logged</h3>
					<ul class="ld-list">
						<LastDoneRow
							v-for="row in never"
							:key="row.name"
							:row="row"
							:open="expanded === row.name"
							:today-key="habitsStore.todayKey"
							@toggle="toggle(row.name)"
							@open-day="openDay"
							@log-today="logToday(row)"
							@set-cycle="(every, unit) => setCycle(row, every, unit)" />
					</ul>
				</template>

				<p
					v-if="loading"
					class="ld-loading"
					aria-live="polite">
					Digging through your history…
				</p>

				<div
					v-else-if="!chores.length && !logged.length && !never.length"
					class="dt-empty">
					<PixelIcon
						:icon="query ? 'search' : 'potted_plant'"
						:palette="query ? 'orange' : 'green'"
						:size="40" />
					<p v-if="query">No habit matches “{{ query.trim() }}”.</p>
					<p v-else>Nothing logged yet. Log a habit and you can always look up when you last did it.</p>
				</div>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { useInsightsStore } from "@/stores/insights";
import { useCarouselStore } from "@/stores/useCarouselStore";
import { useCyclesStore } from "@/stores/cycles";
import { useRemindersStore } from "@/stores/reminders";
import { useToastStore } from "@/stores/toast";
import { useLogNoteStore } from "@/stores/logNote";
import { fromDateKey, type DateKey } from "@/utils/date";
import { displayName, matchesQuery, normalizeText } from "@/utils/habitCatalog";
import { averageGap, buildHabitHistory, daysBetween, findNote, freshness, type Freshness } from "@/utils/lastDone";
import { cycleStatus, everyLabel, type CycleState, type CycleUnit } from "@/utils/cycles";
import LastDoneRow, { type LastDoneItem } from "./LastDoneRow.vue";

const NEVER_LIMIT = 5;

const visible = defineModel<boolean>({ default: false });
const habitsStore = useHabitsStore();
const insights = useInsightsStore();
const carouselStore = useCarouselStore();
const toast = useToastStore();
const logNote = useLogNoteStore();
const cyclesStore = useCyclesStore();
const remindersStore = useRemindersStore();

// Kolor plakietki obowiązku: zielony, żółty tuż przed terminem, czerwony po
const CYCLE_FRESHNESS: Record<CycleState, Freshness> = {
	ok: "fresh",
	soon: "due",
	today: "due",
	overdue: "overdue",
};

const query = ref("");
const sort = ref<"recent" | "oldest">("recent");
const expanded = ref<string | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);

async function onShow() {
	const focus = insights.lastDoneFocus;
	if (focus) {
		query.value = "";
		expanded.value = focus;
	}
	// Na telefonie klawiatura zasłoniłaby połowę listy — fokus tylko z myszką
	if (!focus && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
		nextTick(() => searchRef.value?.focus());
	}
	if (!habitsStore.allHistoryLoaded) {
		loading.value = true;
		await habitsStore.ensureAllHistory();
		loading.value = false;
	}
	if (focus) {
		await nextTick();
		document
			.querySelector(`.last-done-dialog [data-habit="${CSS.escape(focus)}"]`)
			?.scrollIntoView({ block: "nearest" });
	}
}

const normalizedQuery = computed(() => normalizeText(query.value.trim()));

const history = computed(() => {
	const today = habitsStore.todayKey;
	// Wpisy „na przyszłość” (zaplanowane) nie są odpowiedzią na „kiedy ostatnio”
	const days = Object.values(habitsStore.days).filter((d) => d.date <= today);
	return buildHabitHistory(days);
});

// Obowiązki cykliczne mają własną sekcję na górze, najpilniejsze najpierw
const chores = computed<LastDoneItem[]>(() => {
	const today = habitsStore.todayKey;
	const rows: LastDoneItem[] = [];
	for (const cycle of cyclesStore.cycles) {
		const habit = habitsStore.resolve(cycle);
		if (!matchesQuery(habit, normalizedQuery.value)) continue;
		const entry = history.value.get(cycle.name);
		const dates = entry?.dates ?? [];
		const status = cycleStatus(cycle, dates[0] ?? null, today);
		rows.push({
			name: cycle.name,
			habit,
			dates,
			count: entry?.count ?? 0,
			notes: entry?.notes ?? {},
			matchedNote: null,
			daysAgo: dates.length ? daysBetween(dates[0], today) : 0,
			gap: averageGap(dates),
			fresh: CYCLE_FRESHNESS[status.state],
			never: !dates.length,
			cycle: { cycle, status },
		});
	}
	return rows.sort(
		(a, b) =>
			a.cycle!.status.daysLeft - b.cycle!.status.daysLeft ||
			displayName(a.habit).localeCompare(displayName(b.habit)),
	);
});

const dueCount = computed(() => chores.value.filter((r) => r.cycle!.status.daysLeft <= 0).length);

const logged = computed<LastDoneItem[]>(() => {
	const today = habitsStore.todayKey;
	const rows: LastDoneItem[] = [];
	for (const entry of history.value.values()) {
		if (cyclesStore.cycleFor(entry.name)) continue;
		const habit = habitsStore.resolve(entry);
		// Szukamy też w notatkach: „filtr” znajdzie mycie lodówki
		const byName = matchesQuery(habit, normalizedQuery.value);
		const matchedNote = byName ? null : findNote(entry, normalizedQuery.value, normalizeText);
		if (!byName && !matchedNote) continue;
		const daysAgo = daysBetween(entry.dates[0], today);
		const gap = averageGap(entry.dates);
		rows.push({
			...entry,
			habit,
			daysAgo,
			gap,
			fresh: freshness(daysAgo, gap),
			never: false,
			matchedNote,
		});
	}
	const dir = sort.value === "recent" ? 1 : -1;
	return rows.sort(
		(a, b) => dir * (a.daysAgo - b.daysAgo) || displayName(a.habit).localeCompare(displayName(b.habit)),
	);
});

// Przy wyszukiwaniu pokazujemy też habity, których jeszcze nie było —
// od razu można zapisać „zrobione dziś”
const never = computed<LastDoneItem[]>(() => {
	if (!normalizedQuery.value) return [];
	return habitsStore.allHabitsList
		.filter(
			(h) =>
				!history.value.has(h.name) && !cyclesStore.cycleFor(h.name) && matchesQuery(h, normalizedQuery.value),
		)
		.slice(0, NEVER_LIMIT)
		.map((habit) => ({
			name: habit.name,
			habit,
			dates: [],
			count: 0,
			notes: {},
			matchedNote: null,
			daysAgo: 0,
			gap: null,
			fresh: "fresh" as const,
			never: true,
		}));
});

const countLabel = computed(() => {
	const n = logged.value.length + chores.value.length;
	if (normalizedQuery.value) return n === 0 && never.value.length ? "Not in your history yet" : `${n} found`;
	return `${n} ${n === 1 ? "habit" : "habits"}`;
});

function toggle(name: string) {
	expanded.value = expanded.value === name ? null : name;
}

function openFirst() {
	const first = chores.value[0] ?? logged.value[0] ?? never.value[0];
	if (first) expanded.value = first.name;
}

function openDay(key: DateKey) {
	habitsStore.setDate(fromDateKey(key));
	carouselStore.setActiveCard("manage");
	visible.value = false;
}

async function setCycle(row: LastDoneItem, every: number | null, unit: CycleUnit) {
	const previous = cyclesStore.cycleFor(row.name);
	expanded.value = row.name;
	await cyclesStore.setCycle(row.name, every, unit);
	const label = displayName(row.habit);
	if (every === null) {
		if (previous) toast.undoable(`${label} no longer repeats`, () => cyclesStore.restore(previous));
		return;
	}
	const status = cyclesStore.statusFor(row.name);
	if (!status) return;
	toast.show(`${label}: ${everyLabel({ every, unit }).toLowerCase()} · next ${formatDue(status.due)}`, { tone: "success" });
	// Powiadomienie w dniu terminu — o zgodę pytamy przy pierwszym obowiązku
	if (!previous) remindersStore.ensurePermission();
	await nextTick();
	document
		.querySelector(`.last-done-dialog [data-habit="${CSS.escape(row.name)}"]`)
		?.scrollIntoView({ block: "nearest" });
}

function formatDue(key: DateKey) {
	return fromDateKey(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function logToday(row: LastDoneItem) {
	const log = habitsStore.logHabit(row.habit, habitsStore.todayKey);
	if (!log) return;
	expanded.value = row.name;
	const key = habitsStore.todayKey;
	toast.undoable(
		`${displayName(row.habit)} logged for today`,
		() => habitsStore.removeLog(log.id, key),
		logNote.toastAction(log.id, key),
	);
}
</script>

<style scoped>
.ins {
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
	/* Stała wysokość — okno nie „skacze” przy wpisywaniu */
	height: min(82dvh, 44rem);
	padding: 1.1rem 1.25rem 0.75rem;
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
.ld-search {
	position: relative;
}
.ld-search i {
	position: absolute;
	left: 0.95rem;
	top: 50%;
	transform: translateY(-50%);
	color: var(--dt-accent);
	pointer-events: none;
}
.ld-search .dt-input {
	padding-left: 2.6rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-soft);
}
.ld-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}
.ld-toolbar .dt-segmented button {
	white-space: nowrap;
}
.ld-count {
	margin: 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.ld-scroll {
	flex: 1;
	min-height: 0;
	margin: 0 -0.6rem;
	padding: 0 0.1rem 0.5rem;
	overflow-y: auto;
	scrollbar-width: thin;
}
.ld-list {
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
	margin: 0;
	padding: 0;
}
.ld-section-title {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0.25rem 0.6rem 0.35rem;
}
.ld-section-title:not(:first-child) {
	margin-top: 0.9rem;
}
.ld-section-badge {
	padding: 0.05rem 0.45rem;
	border-radius: var(--dt-radius-pill);
	background: color-mix(in srgb, var(--dt-danger) 16%, var(--dt-surface));
	color: color-mix(in srgb, var(--dt-danger) 70%, var(--dt-text));
	font-size: var(--dt-text-xs);
	text-transform: none;
	letter-spacing: 0;
}
.ld-never-title {
	margin: 0.9rem 0.6rem 0.35rem;
}
.ld-loading {
	margin: 0.5rem 0.6rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
}
</style>
