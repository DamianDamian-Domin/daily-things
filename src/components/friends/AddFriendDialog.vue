<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'add-friend-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog friend-dialog"
		@show="onShow"
		@hide="onHide">
		<div class="af">
			<div class="af-head">
				<h2
					id="add-friend-title"
					class="dt-title">
					{{ fromInvite && card ? `Add ${card.name}?` : "Add a friend" }}
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

			<!-- Znaleziona osoba -->
			<div
				v-if="card"
				class="af-found">
				<PixelAvatar
					:avatar="card.avatar"
					:size="64" />
				<div class="af-found-text">
					<p class="af-found-name">{{ card.name }}</p>
					<p class="af-found-code">Code {{ card.code }}</p>
				</div>
			</div>
			<p
				v-if="card && fromInvite"
				class="dt-subtitle">
				{{ card.name }} invited you to cheer each other on. You'll see each other's streaks and
				weekly goals.
			</p>

			<form
				v-if="!fromInvite || !card"
				class="dt-field"
				novalidate
				@submit.prevent="find">
				<label
					for="friend-code-input"
					class="dt-label"
					>Friend's code</label
				>
				<div class="af-row">
					<input
						id="friend-code-input"
						ref="inputRef"
						v-model="codeInput"
						class="dt-input af-code-input"
						inputmode="text"
						autocomplete="off"
						autocapitalize="characters"
						spellcheck="false"
						maxlength="8"
						placeholder="e.g. K7M2QX"
						:aria-invalid="error ? 'true' : undefined"
						:aria-describedby="error ? 'friend-code-error' : 'friend-code-hint'"
						@input="onInput" />
					<button
						type="submit"
						class="dt-btn dt-btn-soft"
						:disabled="!canFind || busy">
						{{ busy && !card ? "Looking…" : "Find" }}
					</button>
				</div>
				<p
					v-if="error"
					id="friend-code-error"
					class="dt-error-text"
					role="alert">
					{{ error }}
				</p>
				<p
					v-else
					id="friend-code-hint"
					class="dt-hint">
					Six letters and numbers — ask your friend to share theirs.
				</p>
			</form>

			<div
				v-if="card"
				class="af-actions">
				<button
					type="button"
					class="dt-btn dt-btn-ghost"
					@click="fromInvite ? (visible = false) : reset()">
					{{ fromInvite ? "Not now" : "Back" }}
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-primary"
					:disabled="busy"
					@click="send">
					{{ busy ? "Sending…" : `Add ${card.name}` }}
				</button>
			</div>

			<!-- Mój kod -->
			<div
				v-if="!fromInvite && myCode"
				class="af-mine">
				<p class="af-mine-label">Or share yours</p>
				<div class="af-mine-row">
					<span
						class="af-mine-code"
						aria-hidden="true"
						>{{ myCode }}</span
					>
					<span class="sr-only">Your code: {{ myCode.split("").join(" ") }}</span>
					<button
						type="button"
						class="dt-btn dt-btn-outline dt-btn-sm"
						@click="copyCode(myCode)">
						<i
							class="pi pi-copy"
							aria-hidden="true"></i>
						Copy
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-soft dt-btn-sm"
						@click="shareInvite(myCode)">
						<i
							class="pi pi-share-alt"
							aria-hidden="true"></i>
						Invite
					</button>
				</div>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { useFriendsStore } from "@/stores/friends";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";
import { isValidCode, normalizeCode, type CodeCard } from "@/services/friends";
import { useInvite } from "@/utils/useInvite";

const props = defineProps<{ initialCode?: string | null }>();
const emit = defineEmits<{ (e: "done"): void }>();
const visible = defineModel<boolean>({ default: false });

const friendsStore = useFriendsStore();
const profileStore = useProfileStore();
const toast = useToastStore();
const { copyCode, shareInvite } = useInvite();

const myCode = computed(() => profileStore.friendCode);
const codeInput = ref("");
const card = ref<CodeCard | null>(null);
const error = ref<string | null>(null);
const busy = ref(false);
const fromInvite = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const canFind = computed(() => isValidCode(normalizeCode(codeInput.value)));

function reset() {
	card.value = null;
	error.value = null;
	nextTick(() => inputRef.value?.focus());
}

function onInput() {
	error.value = null;
	codeInput.value = normalizeCode(codeInput.value);
}

async function onShow() {
	card.value = null;
	error.value = null;
	busy.value = false;
	fromInvite.value = Boolean(props.initialCode);
	codeInput.value = props.initialCode ?? "";
	if (props.initialCode) await find();
	else nextTick(() => inputRef.value?.focus());
}

function onHide() {
	if (fromInvite.value) friendsStore.clearInvite();
	emit("done");
}

async function find() {
	const code = normalizeCode(codeInput.value);
	if (!isValidCode(code)) {
		error.value = "That code doesn't look right — it has 6 letters and numbers.";
		return;
	}
	if (code === myCode.value) {
		error.value = "That's your own code 🙂";
		fromInvite.value = false;
		return;
	}
	busy.value = true;
	error.value = null;
	try {
		const found = await friendsStore.lookup(code);
		if (!found) {
			error.value = "We couldn't find that code. Double-check it with your friend?";
			fromInvite.value = false;
		} else {
			card.value = found;
		}
	} catch (err) {
		console.error("Code lookup failed", err);
		error.value = "Couldn't look that up — check your connection.";
		fromInvite.value = false;
	} finally {
		busy.value = false;
	}
}

async function send() {
	if (!card.value) return;
	busy.value = true;
	const result = await friendsStore.sendRequest(card.value);
	busy.value = false;
	if (result.ok) {
		toast.show(result.message, { tone: "success" });
		visible.value = false;
	} else if (result.reason === "error") {
		toast.error(result.message);
	} else {
		toast.show(result.message);
		visible.value = false;
	}
}
</script>

<style scoped>
.af {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.1rem 1.25rem 1.25rem;
}
.af-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}
.af-row {
	display: flex;
	gap: 0.5rem;
}
.af-code-input {
	flex: 1;
	min-width: 0;
	font-weight: 700;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}
.af-code-input::placeholder {
	font-weight: 400;
	letter-spacing: 0.02em;
}
.af-found {
	display: flex;
	align-items: center;
	gap: 0.9rem;
	padding: 0.75rem 0.85rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-accent-softer);
	border: 1px solid var(--dt-border);
}
.af-found-name {
	margin: 0;
	font-size: var(--dt-text-lg);
	font-weight: 700;
	color: var(--dt-text);
}
.af-found-code {
	margin: 0.1rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	letter-spacing: 0.06em;
}
.af-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}
.af-mine {
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
	padding-top: 0.9rem;
	border-top: 1px dashed var(--dt-border-strong);
}
.af-mine-label {
	margin: 0;
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text-2);
}
.af-mine-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}
.af-mine-code {
	flex: 1;
	min-width: 7rem;
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: 0.2em;
	color: var(--dt-accent-ink);
}
</style>

<style>
.friend-dialog.p-dialog {
	width: min(94vw, 26rem);
}
</style>
