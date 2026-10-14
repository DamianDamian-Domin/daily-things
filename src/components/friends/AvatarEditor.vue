<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'avatar-editor-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog avatar-dialog"
		@show="onShow">
		<div class="ae">
			<div class="ae-head">
				<h2
					id="avatar-editor-title"
					class="dt-title">
					{{ m.yourAvatar }}
				</h2>
				<button
					type="button"
					class="dt-icon-btn"
					:aria-label="c.close"
					@click="visible = false">
					<i
						class="pi pi-times"
						aria-hidden="true"></i>
				</button>
			</div>

			<div class="ae-stage">
				<div
					class="ae-preview"
					:class="{ bump }">
					<PixelAvatar
						:avatar="draft"
						:size="128"
						:alt="m.avatarPreview" />
				</div>
				<button
					type="button"
					class="dt-btn dt-btn-soft dt-btn-sm"
					@click="randomize">
					<span aria-hidden="true">🎲</span> {{ m.randomize }}
				</button>
			</div>

			<div
				class="dt-segmented ae-tabs"
				role="group"
				:aria-label="m.avatarPartAria">
				<button
					v-for="g in GROUPS"
					:key="g.id"
					type="button"
					:aria-pressed="tab === g.id"
					@click="tab = g.id">
					{{ g.label() }}
				</button>
			</div>

			<div class="ae-body">
				<fieldset
					v-for="part in currentParts"
					:key="part"
					class="ae-group">
					<legend class="dt-label">{{ partLabel(part) }}</legend>
					<div
						class="ae-options"
						:class="{ 'is-swatches': isSwatchPart(part) }">
						<label
							v-for="key in AVATAR_PARTS[part]"
							:key="key"
							class="ae-option">
							<input
								v-model="draft[part]"
								type="radio"
								class="sr-only"
								:name="`avatar-${part}`"
								:value="key" />
							<span
								v-if="isSwatchPart(part)"
								class="ae-swatch"
								:class="{ 'is-dark': isDark(optionSwatch(part, key)) }"
								:style="{ background: optionSwatch(part, key) ?? undefined }"
								v-tooltip.top="optionLabel(part, key)">
								<i
									class="pi pi-check"
									aria-hidden="true"></i>
							</span>
							<span
								v-else
								class="ae-tile">
								<span
									class="ae-thumb"
									:style="cropStyle(part)">
									<img
										:src="thumb(part, key)"
										alt=""
										aria-hidden="true"
										draggable="false" />
								</span>
								<span
									class="ae-caption"
									aria-hidden="true"
									>{{ optionLabel(part, key) }}</span
								>
							</span>
							<span class="sr-only">{{ optionLabel(part, key) }}</span>
						</label>
					</div>
				</fieldset>
			</div>

			<div class="ae-actions">
				<button
					type="button"
					class="dt-btn dt-btn-ghost"
					@click="visible = false">
					{{ c.cancel }}
				</button>
				<button
					type="button"
					class="dt-btn dt-btn-primary"
					@click="save">
					{{ m.saveAvatar }}
				</button>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";
import {
	AVATAR_PARTS,
	avatarUrl,
	optionLabel,
	optionSwatch,
	randomAvatar,
	sameAvatar,
	type AvatarConfig,
	type AvatarPart,
} from "@/utils/avatar";
import { plain } from "@/utils/plain";
import { profileMessages as m } from "@/i18n/messages/profile";
import { commonMessages as c } from "@/i18n/messages/common";

type GroupId = "face" | "hair" | "outfit" | "extras";

// Etykiety czytamy przy renderze — podążają za wybranym językiem
const GROUPS: Array<{ id: GroupId; label: () => string; parts: AvatarPart[] }> = [
	{ id: "face", label: () => m.groupFace, parts: ["skin", "eyes", "mouth"] },
	{ id: "hair", label: () => m.groupHair, parts: ["hair", "hairColor"] },
	{ id: "outfit", label: () => m.groupOutfit, parts: ["top", "topColor"] },
	{ id: "extras", label: () => m.groupExtras, parts: ["accessory", "bg"] },
];

const SWATCH_PARTS: AvatarPart[] = ["skin", "hairColor", "topColor", "bg"];

// Przybliżenie miniaturek na fragment, który się zmienia (np. oczy)
const CROPS: Partial<Record<AvatarPart, { z: number; fy: number }>> = {
	eyes: { z: 2, fy: 0.46 },
	mouth: { z: 2, fy: 0.52 },
	top: { z: 1.5, fy: 0.78 },
	hair: { z: 1.1, fy: 0.4 },
	accessory: { z: 1.2, fy: 0.42 },
};

const profileStore = useProfileStore();
const toast = useToastStore();

const visible = computed({
	get: () => profileStore.isEditorOpen,
	set: (open: boolean) => (profileStore.isEditorOpen = open),
});

const draft = ref<AvatarConfig>(plain(profileStore.avatar));
const tab = ref<GroupId>("face");
const bump = ref(false);

const currentParts = computed(() => GROUPS.find((g) => g.id === tab.value)!.parts);

function onShow() {
	draft.value = plain(profileStore.avatar);
	tab.value = "face";
}

function isSwatchPart(part: AvatarPart) {
	return SWATCH_PARTS.includes(part);
}

// Jasny czy ciemny znaczek ✓ na próbce koloru
function isDark(hex: string | null) {
	if (!hex) return false;
	const n = parseInt(hex.slice(1), 16);
	const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
	return lum < 120;
}

function partLabel(part: AvatarPart): string {
	switch (part) {
		case "skin":
			return m.partSkin;
		case "eyes":
			return m.partEyes;
		case "mouth":
			return m.partMouth;
		case "hair":
			return m.partHair;
		case "hairColor":
			return draft.value.hair === "hijab" ? m.partScarfColor : m.partHairColor;
		case "top":
			return m.partTop;
		case "topColor":
			return draft.value.hair === "beanie" || draft.value.accessory === "cap"
				? m.partTopHatColor
				: m.partTopColor;
		case "accessory":
			return m.partAccessory;
		case "bg":
			return m.partBg;
	}
}

function thumb(part: AvatarPart, key: string) {
	return avatarUrl({ ...draft.value, [part]: key } as AvatarConfig);
}

function cropStyle(part: AvatarPart) {
	const crop = CROPS[part] ?? { z: 1, fy: 0.5 };
	return {
		"--z": String(crop.z),
		"--left": `${(0.5 - 0.5 * crop.z) * 100}%`,
		"--top": `${(0.5 - crop.fy * crop.z) * 100}%`,
	};
}

function randomize() {
	draft.value = randomAvatar();
	bump.value = false;
	requestAnimationFrame(() => (bump.value = true));
}

function save() {
	const changed = !sameAvatar(draft.value, profileStore.savedAvatar);
	profileStore.saveAvatar(plain(draft.value));
	visible.value = false;
	if (changed) toast.show(m.lookingGood, { tone: "success" });
}
</script>

<style scoped>
.ae {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	padding: 1.1rem 1.25rem 1.1rem;
	max-height: min(88dvh, 46rem);
}
.ae-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}
.ae-stage {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.6rem;
}
.ae-preview {
	padding: 0.35rem;
	border-radius: 2.6rem;
	background: var(--dt-surface-sunken);
	box-shadow: var(--dt-shadow-sm);
}
.ae-preview.bump {
	animation: ae-bump 0.35s var(--dt-spring);
}
@keyframes ae-bump {
	0% {
		transform: scale(0.92);
	}
	100% {
		transform: scale(1);
	}
}
.ae-tabs {
	align-self: center;
}
.ae-body {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 0 -0.4rem;
	padding: 0.2rem 0.4rem;
	overscroll-behavior: contain;
}
.ae-group {
	border: none;
	margin: 0;
	padding: 0;
	min-width: 0;
}
.ae-group legend {
	margin-bottom: 0.45rem;
	padding: 0;
}
.ae-options {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(4.4rem, 1fr));
	gap: 0.45rem;
}
.ae-options.is-swatches {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
.ae-option {
	position: relative;
	cursor: pointer;
}
.ae-tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.35rem 0.25rem 0.3rem;
	border-radius: var(--dt-radius);
	border: 2px solid transparent;
	background: var(--dt-surface-soft);
	transition:
		border-color 0.18s ease,
		background-color 0.18s ease;
}
@media (hover: hover) {
	.ae-option:hover .ae-tile {
		background: var(--dt-hover-bg);
	}
}
.ae-thumb {
	position: relative;
	display: block;
	width: 3.2rem;
	height: 3.2rem;
	border-radius: 0.9rem;
	overflow: hidden;
}
.ae-thumb img {
	position: absolute;
	left: var(--left);
	top: var(--top);
	width: calc(var(--z) * 100%);
	height: calc(var(--z) * 100%);
	max-width: none;
	image-rendering: pixelated;
	pointer-events: none;
}
.ae-caption {
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-2);
	text-align: center;
	line-height: 1.2;
}
.ae-option input:checked + .ae-tile {
	border-color: var(--dt-accent);
	background: var(--dt-accent-soft);
}
.ae-option input:checked + .ae-tile .ae-caption {
	color: var(--dt-accent-ink);
}
.ae-option input:focus-visible + .ae-tile,
.ae-option input:focus-visible + .ae-swatch {
	outline: 2px solid var(--dt-focus);
	outline-offset: 2px;
}
.ae-swatch {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	border: 2px solid var(--dt-surface);
	box-shadow: 0 0 0 1px var(--dt-border-strong);
	transition: transform 0.18s var(--dt-ease);
}
.ae-swatch i {
	font-size: 0.8rem;
	font-weight: 700;
	color: #3b2a20;
	opacity: 0;
}
@media (hover: hover) {
	.ae-option:hover .ae-swatch {
		transform: scale(1.06);
	}
}
.ae-option input:checked + .ae-swatch {
	box-shadow: 0 0 0 2px var(--dt-accent);
}
.ae-option input:checked + .ae-swatch i {
	opacity: 1;
}
/* Ciemne próbki (np. ciemna skóra) — jasny znaczek */
.ae-swatch.is-dark i {
	color: #fff;
}
.ae-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
	padding-top: 0.25rem;
	border-top: 1px solid var(--dt-border);
}
</style>

<style>
.avatar-dialog.p-dialog {
	width: min(94vw, 30rem);
}
@media (max-width: 640px) {
	.avatar-dialog.p-dialog {
		width: 100vw;
		max-height: 100dvh;
		margin: 0;
		align-self: flex-end;
		border-radius: var(--dt-radius-xl) var(--dt-radius-xl) 0 0 !important;
	}
	.avatar-dialog .ae {
		max-height: 92dvh;
		padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
	}
}
</style>
