<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'challenge-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog friend-dialog"
		@show="onShow">
		<form
			class="cd"
			novalidate
			@submit.prevent="submit">
			<div class="cd-head">
				<h2
					id="challenge-title"
					class="dt-title">
					Start a challenge
				</h2>
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
			<p class="dt-subtitle cd-sub">Pick something to do every day, together. Everyone checks in once a day.</p>

			<!-- ============ CO ============ -->
			<fieldset class="cd-field">
				<legend class="dt-label">What</legend>
				<div class="cd-templates">
					<button
						v-for="t in templates"
						:key="t.key"
						type="button"
						class="cd-template"
						:aria-pressed="templateKey === t.key"
						@click="pick(t.key)">
						<PixelIcon
							:icon="t.icon"
							:palette="t.palette"
							:size="26" />
						<span>{{ t.title }}</span>
					</button>
				</div>
			</fieldset>

			<div class="dt-field">
				<label
					for="challenge-name"
					class="dt-label"
					>Name</label
				>
				<input
					id="challenge-name"
					ref="nameRef"
					v-model="title"
					class="dt-input"
					:maxlength="MAX_TITLE_LENGTH"
					autocomplete="off"
					placeholder="e.g. No sweets" />
			</div>

			<!-- ============ JAK DŁUGO ============ -->
			<fieldset class="cd-field">
				<legend class="dt-label">How long</legend>
				<div class="cd-chips">
					<button
						v-for="d in CHALLENGE_LENGTHS"
						:key="d"
						type="button"
						class="dt-chip"
						:aria-pressed="days === d"
						@click="days = d">
						{{ d }} days
					</button>
				</div>
			</fieldset>

			<fieldset class="cd-field">
				<legend class="dt-label">Starts</legend>
				<div class="cd-chips">
					<button
						type="button"
						class="dt-chip"
						:aria-pressed="!tomorrow"
						@click="tomorrow = false">
						Today
					</button>
					<button
						type="button"
						class="dt-chip"
						:aria-pressed="tomorrow"
						@click="tomorrow = true">
						Tomorrow
					</button>
				</div>
			</fieldset>

			<!-- ============ Z KIM ============ -->
			<fieldset class="cd-field">
				<legend class="dt-label">With</legend>
				<ul class="cd-friends">
					<li
						v-for="f in friendsStore.friends"
						:key="f.uid">
						<label
							class="cd-friend"
							:class="{ on: chosen.has(f.uid), off: !chosen.has(f.uid) && full }">
							<input
								type="checkbox"
								class="sr-only"
								:checked="chosen.has(f.uid)"
								:disabled="!chosen.has(f.uid) && full"
								@change="toggleFriend(f.uid)" />
							<PixelAvatar
								:avatar="f.avatar"
								:size="36" />
							<span class="cd-friend-name">{{ f.name }}</span>
							<i
								:class="chosen.has(f.uid) ? 'pi pi-check-circle' : 'pi pi-circle'"
								aria-hidden="true"></i>
						</label>
					</li>
				</ul>
				<p class="dt-hint">Up to {{ MAX_CHALLENGE_PEOPLE - 1 }} friends. They'll get an invite to join.</p>
			</fieldset>

			<div class="cd-actions">
				<button
					type="button"
					class="dt-btn dt-btn-ghost"
					@click="visible = false">
					Cancel
				</button>
				<button
					type="submit"
					class="dt-btn dt-btn-primary"
					:disabled="!canSubmit || busy">
					{{ busy ? "Starting…" : "Start challenge" }}
				</button>
			</div>
		</form>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useChallengesStore } from "@/stores/challenges";
import { useFriendsStore } from "@/stores/friends";
import { useHabitsStore } from "@/stores/habits";
import {
	CHALLENGE_LENGTHS,
	CHALLENGE_TEMPLATES,
	CUSTOM_CHALLENGE_ICON,
	CUSTOM_CHALLENGE_PALETTE,
	MAX_CHALLENGE_PEOPLE,
	MAX_TITLE_LENGTH,
} from "@/utils/challenges";
import { addDays, fromDateKey, toDateKey } from "@/utils/date";

const props = defineProps<{ friendUid?: string | null }>();
const visible = defineModel<boolean>({ default: false });

const challengesStore = useChallengesStore();
const friendsStore = useFriendsStore();
const habitsStore = useHabitsStore();

const templates = [
	...CHALLENGE_TEMPLATES,
	{ key: "custom", title: "Your own", icon: CUSTOM_CHALLENGE_ICON, palette: CUSTOM_CHALLENGE_PALETTE, days: 7 },
];

const templateKey = ref("sweets");
const title = ref("");
const days = ref<number>(7);
const tomorrow = ref(false);
const chosen = ref<Set<string>>(new Set());
const busy = ref(false);
const nameRef = ref<HTMLInputElement | null>(null);

const full = computed(() => chosen.value.size >= MAX_CHALLENGE_PEOPLE - 1);
const canSubmit = computed(() => title.value.trim().length > 0 && chosen.value.size > 0);

function pick(key: string) {
	const t = templates.find((x) => x.key === key);
	if (!t) return;
	templateKey.value = key;
	days.value = t.days;
	if (key === "custom") {
		title.value = "";
		nextTick(() => nameRef.value?.focus());
	} else {
		title.value = t.title;
	}
}

function toggleFriend(uid: string) {
	const next = new Set(chosen.value);
	if (next.has(uid)) next.delete(uid);
	else if (!full.value) next.add(uid);
	chosen.value = next;
}

function onShow() {
	busy.value = false;
	tomorrow.value = false;
	pick("sweets");
	const preset = props.friendUid && friendsStore.friends.some((f) => f.uid === props.friendUid);
	// Jeden znajomy? Od razu go zaznaczamy
	chosen.value = new Set(
		preset
			? [props.friendUid as string]
			: friendsStore.friends.length === 1
				? [friendsStore.friends[0].uid]
				: [],
	);
}

async function submit() {
	if (!canSubmit.value || busy.value) return;
	const t = templates.find((x) => x.key === templateKey.value) ?? templates[templates.length - 1];
	const today = fromDateKey(habitsStore.todayKey);
	busy.value = true;
	const ok = await challengesStore.create(
		{
			title: title.value.trim().slice(0, MAX_TITLE_LENGTH),
			icon: t.icon,
			palette: t.palette,
			days: days.value,
			start: toDateKey(tomorrow.value ? addDays(today, 1) : today),
		},
		friendsStore.friends.filter((f) => chosen.value.has(f.uid)),
	);
	busy.value = false;
	if (ok) visible.value = false;
}
</script>

<style scoped>
.cd {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.1rem 1.25rem 1.25rem;
}
.cd-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}
.cd-sub {
	margin: -0.5rem 0 0;
}
.cd-field {
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
	margin: 0;
	padding: 0;
	border: 0;
	min-width: 0;
}
.cd-field legend {
	padding: 0;
	margin-bottom: 0.45rem;
}
.cd-templates {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(6.4rem, 1fr));
	gap: 0.4rem;
}
.cd-template {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.5rem 0.35rem 0.45rem;
	border-radius: var(--dt-radius);
	border: 1px solid var(--dt-border);
	background: var(--dt-surface);
	color: var(--dt-text-2);
	font: inherit;
	font-size: var(--dt-text-xs);
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
	cursor: pointer;
	transition:
		background var(--dt-t-fast) var(--dt-ease),
		border-color var(--dt-t-fast) var(--dt-ease);
}
@media (hover: hover) {
	.cd-template:hover {
		background: var(--dt-hover-bg);
		border-color: var(--dt-hover-border);
	}
}
.cd-template[aria-pressed="true"] {
	background: var(--dt-accent-soft);
	border-color: var(--dt-accent);
	color: var(--dt-accent-ink);
}
.cd-template:focus-visible {
	outline: none;
	box-shadow: var(--dt-focus-ring);
}
.cd-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
}
.cd-friends {
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
	margin: 0;
	padding: 0;
	list-style: none;
	max-height: 14rem;
	overflow-y: auto;
}
.cd-friend {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.35rem 0.6rem 0.35rem 0.4rem;
	border-radius: var(--dt-radius);
	border: 1px solid var(--dt-border);
	cursor: pointer;
	color: var(--dt-text-3);
	transition:
		background var(--dt-t-fast) var(--dt-ease),
		border-color var(--dt-t-fast) var(--dt-ease);
}
.cd-friend.on {
	background: var(--dt-accent-softer);
	border-color: var(--dt-accent);
	color: var(--dt-accent-strong);
}
.cd-friend.off {
	opacity: 0.5;
	cursor: not-allowed;
}
.cd-friend:has(input:focus-visible) {
	box-shadow: var(--dt-focus-ring);
}
.cd-friend-name {
	flex: 1;
	min-width: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.cd-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}
</style>
