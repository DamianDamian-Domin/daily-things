<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'reminders-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog reminders-dialog">
		<div class="rem-shell">
			<div class="rem-head">
				<span
					class="rem-emoji"
					aria-hidden="true"
					>⏰</span
				>
				<div class="rem-head-text">
					<h2
						id="reminders-title"
						class="dt-title">
						Reminders
					</h2>
					<p class="dt-subtitle">A gentle nudge at your time. Skipped once the goal is done.</p>
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

			<p
				v-if="note"
				class="rem-note"
				:class="{ 'is-warn': remindersStore.permission === 'denied' }">
				<i
					:class="remindersStore.permission === 'denied' ? 'pi pi-bell-slash' : 'pi pi-mobile'"
					aria-hidden="true"></i>
				{{ note }}
			</p>

			<ul
				v-if="rows.length"
				class="rem-list">
				<li
					v-for="row in rows"
					:key="row.name"
					class="rem-row">
					<span class="rem-icon">
						<PixelIcon
							:icon="row.habbit.icon"
							:palette="paletteFor(row.habbit)"
							:size="28" />
					</span>
					<span class="rem-name">
						{{ row.label }}
						<small v-if="row.target > 1">{{ row.target }}× a day</small>
					</span>

					<template v-if="row.time">
						<label
							:for="`rem-${row.name}`"
							class="sr-only"
							>Reminder time for {{ row.label }}</label
						>
						<input
							:id="`rem-${row.name}`"
							type="time"
							class="dt-input rem-time"
							required
							:value="row.time"
							@change="onTimeChange(row.name, $event)" />
						<button
							type="button"
							class="dt-icon-btn"
							:aria-label="`Turn off reminder for ${row.label}`"
							v-tooltip.bottom="'Turn off'"
							@click="turnOff(row.name, row.time)">
							<i
								class="pi pi-times"
								aria-hidden="true"></i>
						</button>
					</template>
					<button
						v-else
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm rem-add"
						:aria-label="`Add a reminder for ${row.label}`"
						@click="turnOn(row.name)">
						<i
							class="pi pi-bell"
							aria-hidden="true"></i>
						Add time
					</button>
				</li>
			</ul>

			<div
				v-else
				class="dt-empty rem-empty">
				<PixelIcon
					icon="flag"
					palette="yellow"
					:size="44" />
				<p>Reminders are for daily goals. Pick a goal first and come back here.</p>
			</div>

			<div class="rem-foot">
				<button
					type="button"
					class="dt-btn dt-btn-primary"
					@click="visible = false">
					Done
				</button>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import { useHabbitsStore } from "@/stores/habbits";
import { useRemindersStore } from "@/stores/reminders";
import { useToastStore } from "@/stores/toast";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import PixelIcon from "@/components/ui/PixelIcon.vue";

const visible = defineModel<boolean>({ default: false });

const habbitsStore = useHabbitsStore();
const remindersStore = useRemindersStore();
const toast = useToastStore();

const DEFAULT_TIME = "09:00";

// Jeden wiersz na cel (cel „3× dziennie” to wciąż jedno przypomnienie)
const rows = computed(() => {
	const seen = new Map<string, number>();
	for (const g of habbitsStore.dailyGoalsList) seen.set(g.name, (seen.get(g.name) ?? 0) + 1);
	return [...seen.entries()].map(([name, target]) => {
		const goal = habbitsStore.dailyGoalsList.find((g) => g.name === name)!;
		const habbit = habbitsStore.resolve(goal);
		return { name, target, habbit, label: displayName(habbit), time: remindersStore.timeFor(name) };
	});
});

const note = computed(() => {
	switch (remindersStore.permission) {
		case "unsupported":
			return "Reminders ring on your phone in the Daily Things Android app. Times you set here sync there.";
		case "denied":
			return "Notifications are off for Daily Things. Turn them on in your phone's settings to get nudges.";
		default:
			return "";
	}
});

function turnOn(name: string) {
	remindersStore.setReminder(name, DEFAULT_TIME);
}

function turnOff(name: string, time: string) {
	const label = rows.value.find((r) => r.name === name)?.label ?? "goal";
	remindersStore.setReminder(name, null);
	toast.undoable(`Reminder for ${label} turned off`, () => remindersStore.setReminder(name, time));
}

function onTimeChange(name: string, event: Event) {
	const value = (event.target as HTMLInputElement).value;
	// Puste pole (wyczyszczone w pickerze) nie wyłącza przypomnienia — od tego jest ×
	if (value) remindersStore.setReminder(name, value);
	else (event.target as HTMLInputElement).value = remindersStore.timeFor(name) ?? DEFAULT_TIME;
}
</script>

<style scoped>
.rem-shell {
	display: flex;
	flex-direction: column;
	max-height: min(86dvh, 40rem);
	background: var(--dt-surface);
}
.rem-head {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 1.1rem 1rem 0.6rem 1.25rem;
}
.rem-head-text {
	flex: 1;
	min-width: 0;
}
.rem-emoji {
	display: grid;
	place-items: center;
	width: 2.7rem;
	height: 2.7rem;
	border-radius: 0.9rem;
	font-size: 1.35rem;
	background: var(--dt-accent-soft);
	flex-shrink: 0;
}

.rem-note {
	display: flex;
	align-items: flex-start;
	gap: 0.55rem;
	margin: 0.25rem 1.25rem 0.5rem;
	padding: 0.6rem 0.8rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
	color: var(--dt-text-2);
	font-size: var(--dt-text-sm);
	line-height: 1.45;
}
.rem-note i {
	margin-top: 0.2rem;
	color: var(--dt-accent-ink);
}
.rem-note.is-warn {
	background: var(--dt-danger-soft);
	border-color: transparent;
}
.rem-note.is-warn i {
	color: var(--dt-danger);
}

.rem-list {
	list-style: none;
	margin: 0;
	padding: 0.25rem 1.25rem 0.75rem;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.rem-row {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	min-height: 3.5rem;
	padding: 0.45rem 0.5rem 0.45rem 0.6rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.rem-icon {
	display: grid;
	place-items: center;
	flex-shrink: 0;
}
.rem-name {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	font-weight: 600;
	color: var(--dt-text);
	line-height: 1.25;
	overflow-wrap: anywhere;
}
.rem-name small {
	font-weight: 400;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.rem-time {
	width: 8.75rem;
	flex-shrink: 0;
	min-height: 2.5rem;
	padding: 0.35rem 0.6rem;
	font-variant-numeric: tabular-nums;
}
.rem-add {
	flex-shrink: 0;
	min-height: 2.5rem;
}

.rem-empty {
	padding: 1.25rem 1.5rem 1.5rem;
}
.rem-empty p {
	margin: 0;
	color: var(--dt-text-2);
	font-size: var(--dt-text-sm);
	line-height: 1.5;
	text-align: center;
}

.rem-foot {
	display: flex;
	justify-content: flex-end;
	padding: 0.75rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
	border-top: 1px solid var(--dt-border);
	background: var(--dt-surface-soft);
}
</style>

<style>
.reminders-dialog.p-dialog {
	width: min(96vw, 30rem);
}
@media (max-width: 640px) {
	.reminders-dialog.p-dialog {
		width: 100vw;
		max-height: 100dvh;
		margin: 0;
		align-self: flex-end;
		border-radius: var(--dt-radius-xl) var(--dt-radius-xl) 0 0 !important;
	}
}
</style>
