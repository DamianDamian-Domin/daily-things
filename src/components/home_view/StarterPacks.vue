<template>
	<section
		class="packs"
		aria-labelledby="packs-title">
		<div class="packs-head">
			<h3
				id="packs-title"
				class="dt-section-title">
				{{ title ?? m.starterPacks }}
			</h3>
			<p class="packs-sub">{{ m.packsSub }}</p>
		</div>
		<ul
			class="packs-rail"
			:class="{ 'is-compact': compact }">
			<li
				v-for="p in packs"
				:key="p.pack.key">
				<button
					type="button"
					class="pack"
					:class="{ added: p.added }"
					:style="{ '--tint': PALETTES[p.pack.palette].h, '--tint-strong': PALETTES[p.pack.palette].f }"
					:aria-label="
						p.added ? m.packAlreadyAdded(p.pack.title) : m.addPack(p.pack.title, p.names.join(', '))
					"
					:disabled="p.added"
					@click="addPack(p.pack)">
					<span class="pack-top">
						<PixelIcon
							:icon="p.pack.icon"
							:palette="p.pack.palette"
							:size="30" />
						<span class="pack-state">
							<i
								:class="p.added ? 'pi pi-check' : 'pi pi-plus'"
								aria-hidden="true"></i>
						</span>
					</span>
					<span class="pack-title">{{ p.pack.title }}</span>
					<span
						v-if="!compact"
						class="pack-blurb"
						>{{ p.pack.blurb }}</span
					>
					<span
						class="pack-icons"
						aria-hidden="true">
						<PixelIcon
							v-for="h in p.habits"
							:key="h.name"
							:icon="h.icon"
							:palette="paletteFor(h)"
							:size="22" />
					</span>
				</button>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useHabitsStore } from "@/stores/habits";
import { useToastStore } from "@/stores/toast";
import { displayName, paletteFor } from "@/utils/habitCatalog";
import { PALETTES } from "@/utils/pixelIcons";
import { STARTER_PACKS, packHabits, type StarterPack } from "@/utils/starterPacks";
import { habitsMessages as m } from "@/i18n/messages/habits";

const props = withDefaults(defineProps<{ title?: string; compact?: boolean; limit?: number }>(), {
	// Brak tytułu = domyślny w aktualnym języku
	title: undefined,
	compact: false,
	limit: STARTER_PACKS.length,
});
const emit = defineEmits<{ added: [count: number] }>();

const habitsStore = useHabitsStore();
const toast = useToastStore();

const goalNames = computed(() => new Set(habitsStore.dailyGoalsList.map((g) => g.name)));

const packs = computed(() =>
	STARTER_PACKS.slice(0, props.limit).map((pack) => {
		const habits = packHabits(pack);
		return {
			pack,
			habits,
			names: habits.map(displayName),
			added: habits.every((h) => goalNames.value.has(h.name)),
		};
	}),
);

async function addPack(pack: StarterPack) {
	const previous = [...habitsStore.dailyGoalsList];
	const count = await habitsStore.addDailyGoals(packHabits(pack));
	if (!count) return;
	emit("added", count);
	toast.show(m.packAdded(pack.title, count), {
		tone: "success",
		actionLabel: m.undo,
		action: () => habitsStore.restoreGoals(previous),
	});
}
</script>

<style scoped>
.packs {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
	width: 100%;
	min-width: 0;
}
.packs-head .dt-section-title {
	margin: 0;
}
.packs-sub {
	margin: 0.15rem 0 0;
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.packs-rail {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
	gap: 0.55rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.packs-rail.is-compact {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pack {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.3rem;
	width: 100%;
	height: 100%;
	padding: 0.7rem 0.75rem 0.65rem;
	text-align: left;
	font: inherit;
	color: var(--dt-text);
	border-radius: var(--dt-radius-lg);
	border: 1px solid color-mix(in srgb, var(--tint-strong) 30%, var(--dt-border));
	background: linear-gradient(160deg, color-mix(in srgb, var(--tint) 32%, var(--dt-surface)), var(--dt-surface) 70%);
	cursor: pointer;
	transition:
		transform var(--dt-t-fast) var(--dt-ease),
		box-shadow var(--dt-t-fast) var(--dt-ease),
		border-color var(--dt-t-fast) var(--dt-ease);
}
.pack:not(:disabled):hover {
	transform: translateY(var(--dt-lift));
	box-shadow: var(--dt-shadow-hover);
	border-color: color-mix(in srgb, var(--tint-strong) 60%, var(--dt-border));
}
.pack:not(:disabled):active {
	transform: scale(var(--dt-press));
}
.pack:focus-visible {
	outline: none;
	box-shadow: var(--dt-focus-ring);
}
.pack.added {
	cursor: default;
	opacity: 0.7;
}
.pack-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
}
.pack-state {
	display: grid;
	place-items: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	font-size: 0.7rem;
	color: var(--dt-on-accent);
	background: var(--dt-accent-strong);
}
.pack.added .pack-state {
	background: var(--dt-success-fill);
}
.pack-title {
	font-weight: 700;
	font-size: var(--dt-text-sm);
}
.pack-blurb {
	font-size: var(--dt-text-xs);
	line-height: 1.3;
	color: var(--dt-text-2);
}
.pack-icons {
	display: flex;
	gap: 0.2rem;
	margin-top: auto;
	padding-top: 0.2rem;
}
</style>
