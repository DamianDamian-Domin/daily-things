<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissable-mask
		:show-header="false"
		:draggable="false"
		:pt="{
			root: { 'aria-labelledby': 'friend-detail-title' },
			mask: { class: 'dt-dialog-mask' },
		}"
		class="dt-dialog friend-dialog"
		@show="confirmRemove = false">
		<div
			v-if="friend"
			class="fd">
			<div class="fd-head">
				<PixelAvatar
					:avatar="friend.avatar"
					:size="72" />
				<div class="fd-id">
					<h2
						id="friend-detail-title"
						class="dt-title">
						{{ friend.name }}
					</h2>
					<p class="fd-meta">
						<template v-if="friend.shares">
							<span class="fd-streak">
								<PixelIcon
									icon="local_fire_department"
									:palette="friend.streak ? 'orange' : 'gray'"
									:size="18" />
								{{ friend.streak ? m.streak(friend.streak) : m.noStreak }}
							</span>
							<span>{{ todayLabel }}</span>
						</template>
						<template v-else>{{ m.keepsPrivate }}</template>
					</p>
				</div>
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

			<template v-if="stats">
				<section
					class="fd-section"
					aria-labelledby="fd-week-title">
					<h3
						id="fd-week-title"
						class="dt-section-title">
						{{ m.last7 }}
					</h3>
					<div
						class="fd-bars"
						role="img"
						:aria-label="weekAria">
						<div
							v-for="d in week"
							:key="d.date"
							class="fd-col"
							:class="{ perfect: d.perfect, empty: d.total === 0 }">
							<span class="fd-track">
								<span
									class="fd-fill"
									:style="{ height: `${d.pct}%` }"></span>
							</span>
							<span class="fd-day">{{ d.label }}</span>
						</div>
					</div>
				</section>

				<section
					v-if="badges.length"
					class="fd-section"
					aria-labelledby="fd-badges-title">
					<h3
						id="fd-badges-title"
						class="dt-section-title">
						{{ m.badges(badges.length) }}
					</h3>
					<ul class="fd-habits">
						<li
							v-for="b in badges"
							:key="b.id"
							class="fd-habit fd-badge"
							v-tooltip.top="`${b.title}: ${b.description}`">
							<PixelIcon
								:icon="b.icon"
								:palette="b.palette"
								:size="28" />
							<span class="sr-only">{{ b.title }}</span>
						</li>
					</ul>
				</section>

				<section
					v-if="habits"
					class="fd-section"
					aria-labelledby="fd-today-title">
					<h3
						id="fd-today-title"
						class="dt-section-title">
						{{ m.today }}
					</h3>
					<ul
						v-if="habits.length"
						class="fd-habits">
						<li
							v-for="h in habits"
							:key="h.icon + h.name"
							class="fd-habit">
							<span class="fd-habit-face">
								<PixelIcon
									:icon="h.icon"
									:palette="h.palette"
									:size="28" />
								<span
									v-if="h.count > 1"
									class="fd-count"
									aria-hidden="true"
									>{{ h.count }}</span
								>
							</span>
							<span class="fd-habit-name">{{ h.name }}</span>
							<span
								v-if="h.count > 1"
								class="sr-only"
								>× {{ h.count }}</span
							>
						</li>
					</ul>
					<p
						v-else
						class="fd-note">
						{{ m.nothingToday }}
					</p>
				</section>
				<p
					v-else
					class="fd-note">
					{{ m.keepsHabitsPrivate(friend.name) }}
				</p>
			</template>

			<button
				type="button"
				class="dt-btn dt-btn-primary dt-btn-block fd-cheer"
				:class="{ sent: cheered }"
				:disabled="cheered"
				@click="friendsStore.cheer(friend)">
				{{ cheered ? m.highFivedToday : m.highFiveButton(friend.name) }}
			</button>

			<div class="fd-remove">
				<button
					v-if="!confirmRemove"
					type="button"
					class="dt-btn dt-btn-ghost dt-btn-sm"
					@click="confirmRemove = true">
					{{ m.removeFriend }}
				</button>
				<div
					v-else
					class="fd-confirm"
					role="group"
					:aria-label="m.confirmRemoveAria">
					<span>{{ m.removeQuestion(friend.name) }}</span>
					<button
						type="button"
						class="dt-btn dt-btn-danger dt-btn-sm"
						@click="remove">
						{{ m.remove }}
					</button>
					<button
						type="button"
						class="dt-btn dt-btn-ghost dt-btn-sm"
						@click="confirmRemove = false">
						{{ m.keep }}
					</button>
				</div>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import { useFriendsStore, type FriendRow } from "@/stores/friends";
import { useHabitsStore } from "@/stores/habits";
import { PALETTES, type PaletteKey } from "@/utils/pixelIcons";
import { fromDateKey, weekdayName } from "@/utils/date";
import { ACHIEVEMENTS } from "@/utils/achievements";
import { friendsMessages as m } from "@/i18n/messages/friends";
import { commonMessages as c } from "@/i18n/messages/common";

const props = defineProps<{ friendUid: string | null }>();
const visible = defineModel<boolean>({ default: false });

const friendsStore = useFriendsStore();
const habitsStore = useHabitsStore();
const confirmRemove = ref(false);

// Zawsze świeże dane z magazynu (profil zmienia się na żywo)
const friend = computed<FriendRow | null>(
	() => friendsStore.friends.find((f) => f.uid === props.friendUid) ?? null,
);
const stats = computed(() =>
	friend.value?.profile?.sharing.progress ? friend.value.profile.stats : null,
);
const cheered = computed(() =>
	friend.value ? friendsStore.hasCheeredToday(friend.value.uid) : false,
);

const todayLabel = computed(() => {
	const f = friend.value;
	if (!f) return "";
	if (f.today) return m.todayGoals(f.today.done, f.today.total);
	return f.away ? m.notHereYet : m.noGoalsToday;
});

const week = computed(() =>
	(stats.value?.last7 ?? []).map((d) => ({
		...d,
		label: weekdayName(fromDateKey(d.date), "short").slice(0, 2),
		pct: d.total ? Math.max(6, Math.round((d.done / d.total) * 100)) : 0,
		perfect: d.total > 0 && d.done >= d.total,
	})),
);

const weekAria = computed(
	() =>
		m.weekAriaPrefix +
		week.value
			.map((d) => `${weekdayName(fromDateKey(d.date), "long")} ${d.total ? m.dayOf(d.done, d.total) : m.noGoals}`)
			.join(", "),
);

// Ikony habitów pokazujemy tylko z dzisiejszego dnia znajomego
const habits = computed(() => {
	const profile = friend.value?.profile;
	if (!profile?.sharing.habits || !profile.todayHabits) return null;
	if (profile.stats?.todayKey !== habitsStore.todayKey) return [];
	return profile.todayHabits.map((h) => ({
		...h,
		palette: (h.palette in PALETTES ? h.palette : "orange") as PaletteKey,
	}));
});

// Odznaki znajomego (kolejność jak w katalogu odznak)
const badges = computed(() => {
	const owned = new Set(stats.value?.badges ?? []);
	return ACHIEVEMENTS.filter((a) => owned.has(a.id));
});

function remove() {
	if (!friend.value) return;
	friendsStore.unfriend(friend.value);
	visible.value = false;
}
</script>

<style scoped>
.fd {
	display: flex;
	flex-direction: column;
	gap: 1.1rem;
	padding: 1.1rem 1.25rem 1.1rem;
}
.fd-head {
	display: flex;
	align-items: center;
	gap: 0.9rem;
}
.fd-id {
	flex: 1;
	min-width: 0;
}
.fd-meta {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.1rem;
	margin: 0.2rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.fd-streak {
	display: inline-flex;
	align-items: center;
	gap: 0.15rem;
	font-weight: 600;
}
.fd-section {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
}
.fd-bars {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.4rem;
	padding: 0.7rem 0.6rem 0.5rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface-soft);
	border: 1px solid var(--dt-border);
}
.fd-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
}
.fd-track {
	position: relative;
	display: block;
	width: 100%;
	max-width: 1.6rem;
	height: 4.5rem;
	border-radius: 0.5rem;
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.fd-fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	border-radius: 0.5rem;
	background: linear-gradient(180deg, color-mix(in srgb, var(--dt-accent) 70%, #f3c64f), var(--dt-accent));
	transition: height 0.4s var(--dt-ease);
}
.fd-col.perfect .fd-fill {
	background: linear-gradient(180deg, #f3c64f, var(--dt-gold));
}
.fd-day {
	font-size: var(--dt-text-xs);
	font-weight: 600;
	color: var(--dt-text-3);
}
.fd-habits {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem 0.2rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
/* Kwadracik z ikoną i nazwą pod spodem — same ikony były nieczytelne */
.fd-habit {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	width: 4rem;
}
.fd-habit-face {
	position: relative;
	display: grid;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border-radius: 0.8rem;
	background: var(--dt-surface-sunken);
}
.fd-habit-name {
	max-width: 100%;
	font-size: 0.72rem;
	font-weight: 600;
	line-height: 1.2;
	color: var(--dt-text-2);
	text-align: center;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-word;
}
.fd-count {
	position: absolute;
	top: -0.3rem;
	right: -0.3rem;
	min-width: 1.05rem;
	height: 1.05rem;
	padding: 0 0.2rem;
	border-radius: 999px;
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	font-size: 0.62rem;
	font-weight: 700;
	display: grid;
	place-items: center;
}
.fd-note {
	margin: 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}
.fd-cheer.sent:disabled {
	opacity: 1;
	background: var(--dt-success-soft);
	color: var(--dt-success);
	box-shadow: none;
	cursor: default;
}
.fd-remove {
	display: flex;
	justify-content: center;
	min-height: 2.5rem;
}
.fd-confirm {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5rem;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.fd-badge {
	background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--dt-gold) 12%, var(--dt-surface)), color-mix(in srgb, var(--dt-gold) 30%, var(--dt-surface)));
}
</style>
