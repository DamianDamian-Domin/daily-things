<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{ root: { 'aria-labelledby': 'log-note-title' }, mask: { class: 'dt-dialog-mask' } }"
		class="dt-dialog log-note-dialog"
		@show="onShow"
		@after-hide="noteStore.close()">
		<form
			v-if="log && habit"
			class="note"
			@submit.prevent="save">
			<div class="note-head">
				<PixelIcon
					:icon="habit.icon"
					:palette="paletteFor(habit)"
					:size="36" />
				<div class="note-head-text">
					<h2
						id="log-note-title"
						class="dt-title">
						{{ displayName(habit) }}
					</h2>
					<p class="dt-subtitle">{{ when }}</p>
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

			<div class="dt-field">
				<label
					for="log-note-input"
					class="dt-label"
					>Note</label
				>
				<input
					id="log-note-input"
					ref="inputRef"
					v-model="draft"
					class="dt-input"
					:maxlength="NOTE_MAX_LENGTH"
					placeholder="e.g. changed the filter, model X"
					autocomplete="off"
					enterkeyhint="done" />
				<p class="note-hint">
					<span>Only you can see notes. Search finds them in “When did I last…?”.</span>
					<span
						v-if="draft.length > NOTE_MAX_LENGTH - 40"
						class="note-count"
						>{{ draft.length }}/{{ NOTE_MAX_LENGTH }}</span
					>
				</p>
			</div>

			<div class="note-actions">
				<button
					v-if="log.note"
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm note-remove"
					@click="remove">
					<i
						class="pi pi-trash"
						aria-hidden="true"></i>
					Remove note
				</button>
				<button
					type="submit"
					class="dt-btn dt-btn-primary">
					Save
				</button>
			</div>
		</form>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { useLogNoteStore } from "@/stores/logNote";
import { fromDateKey } from "@/utils/date";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import { cleanNote, NOTE_MAX_LENGTH } from "@/utils/logNote";

const habitsStore = useHabitsStore();
const noteStore = useLogNoteStore();

const draft = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

// Okno trzyma cel do końca animacji zamknięcia (czyścimy go w after-hide)
const visible = ref(false);
watch(
	() => noteStore.target,
	(target) => {
		if (target) visible.value = true;
	},
	{ immediate: true },
);

const log = computed(() => {
	const t = noteStore.target;
	return t ? habitsStore.findLog(t.logId, t.key) : undefined;
});
const habit = computed(() => (log.value ? habitsStore.resolve(log.value) : undefined));

// Wpis zniknął (np. „Cofnij”, usunięcie na innym urządzeniu) — zamykamy
watch(log, (current) => {
	if (!current && visible.value) visible.value = false;
});

const when = computed(() => {
	const t = noteStore.target;
	if (!t) return "";
	const date = fromDateKey(t.key);
	const day =
		t.key === habitsStore.todayKey
			? "Today"
			: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
	const at = log.value?.at;
	if (!at) return day;
	const time = new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
	return `${day} · ${time}`;
});

function onShow() {
	draft.value = log.value?.note ?? "";
	nextTick(() => inputRef.value?.focus());
}

function save() {
	const t = noteStore.target;
	if (t) habitsStore.setLogNote(t.logId, t.key, cleanNote(draft.value));
	visible.value = false;
}

function remove() {
	const t = noteStore.target;
	if (t) habitsStore.setLogNote(t.logId, t.key, "");
	visible.value = false;
}
</script>

<style scoped>
.note {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.1rem 1.25rem 1.25rem;
}
.note-head {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}
.note-head-text {
	flex: 1;
	min-width: 0;
}
.note-head-text .dt-title {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.note-hint {
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
	margin: 0.35rem 0 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.note-count {
	flex-shrink: 0;
	font-variant-numeric: tabular-nums;
}
.note-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
}
.note-remove {
	margin-right: auto;
	color: var(--dt-danger);
}
</style>

<style>
.log-note-dialog.p-dialog {
	width: min(94vw, 26rem);
}
</style>
