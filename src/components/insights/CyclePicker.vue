<template>
	<div class="cp">
		<p
			:id="labelId"
			class="cp-label">
			<i
				class="pi pi-replay"
				aria-hidden="true"></i>
			Repeat this chore
		</p>
		<div
			class="cp-chips"
			role="group"
			:aria-labelledby="labelId">
			<button
				type="button"
				class="dt-chip"
				:aria-pressed="!cycle && !custom"
				@click="turnOff">
				Off
			</button>
			<button
				v-for="preset in CYCLE_PRESETS"
				:key="everyShort(preset)"
				type="button"
				class="dt-chip"
				:aria-pressed="!custom && !!cycle && sameCycle(cycle, preset)"
				:aria-label="everyLabel(preset)"
				@click="pick(preset.every, preset.unit)">
				{{ everyShort(preset) }}
			</button>
			<button
				type="button"
				class="dt-chip"
				:aria-pressed="custom"
				:aria-expanded="custom"
				@click="openCustom">
				{{ isCustomCycle && !custom ? everyLabel(cycle!) : "Custom" }}
			</button>
		</div>

		<form
			v-if="custom"
			class="cp-custom"
			@submit.prevent="saveCustom">
			<label class="cp-every">
				<span>Every</span>
				<input
					v-model.number="draftEvery"
					type="number"
					inputmode="numeric"
					min="1"
					:max="MAX_EVERY[draftUnit]"
					class="dt-input"
					aria-label="How many" />
			</label>
			<div
				class="dt-segmented"
				role="group"
				aria-label="Unit">
				<button
					v-for="unit in CYCLE_UNITS"
					:key="unit"
					type="button"
					:aria-pressed="draftUnit === unit"
					@click="draftUnit = unit">
					{{ draftEvery === 1 ? unit : `${unit}s` }}
				</button>
			</div>
			<button
				type="submit"
				class="dt-btn dt-btn-primary dt-btn-sm"
				:disabled="!draftValid">
				Save
			</button>
		</form>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { HabitCycle } from "@/libs/types";
import {
	CYCLE_PRESETS,
	CYCLE_UNITS,
	everyLabel,
	everyShort,
	MAX_EVERY,
	sameCycle,
	type CycleUnit,
} from "@/utils/cycles";

const props = defineProps<{ cycle: HabitCycle | null; habitKey: string }>();
const emit = defineEmits<{ (e: "set", every: number | null, unit: CycleUnit): void }>();

const labelId = computed(() => `cp-${props.habitKey.replace(/[^a-z0-9]+/gi, "-")}`);
const isCustomCycle = computed(
	() => !!props.cycle && !CYCLE_PRESETS.some((p) => sameCycle(p, props.cycle!)),
);

const custom = ref(false);
const draftEvery = ref(10);
const draftUnit = ref<CycleUnit>("day");
const draftValid = computed(
	() => Number.isInteger(draftEvery.value) && draftEvery.value >= 1 && draftEvery.value <= MAX_EVERY[draftUnit.value],
);

function pick(every: number, unit: CycleUnit) {
	custom.value = false;
	emit("set", every, unit);
}

function turnOff() {
	custom.value = false;
	if (props.cycle) emit("set", null, props.cycle.unit);
}

function openCustom() {
	if (custom.value) {
		custom.value = false;
		return;
	}
	draftEvery.value = props.cycle?.every ?? 10;
	draftUnit.value = props.cycle?.unit ?? "day";
	custom.value = true;
}

function saveCustom() {
	if (!draftValid.value) return;
	pick(draftEvery.value, draftUnit.value);
}
</script>

<style scoped>
.cp {
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
	width: 100%;
}
.cp-label {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	margin: 0;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-2);
}
.cp-label i {
	font-size: 0.75rem;
	color: var(--dt-accent);
}
.cp-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
}
.cp-chips .dt-chip {
	padding: 0.25rem 0.65rem;
	font-variant-numeric: tabular-nums;
}
.cp-custom {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}
.cp-every {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.cp-every .dt-input {
	width: 4.2rem;
	padding: 0.35rem 0.5rem;
	text-align: center;
}
.cp-custom .dt-segmented button {
	padding: 0.3rem 0.6rem;
}
</style>
