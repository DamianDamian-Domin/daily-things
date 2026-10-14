<template>
	<div
		class="ill"
		:class="`ill-${slide}`"
		aria-hidden="true">
		<!-- Powitanie: logo otoczone ikonami habitów -->
		<template v-if="slide === 'welcome'">
			<div class="orbit">
				<img
					src="@/assets/logo.png"
					alt=""
					width="88"
					height="88"
					class="orbit-logo" />
				<span
					v-for="(item, i) in orbit"
					:key="item.icon"
					class="orbit-icon"
					:style="{ '--a': `${i * 60}deg`, '--d': `${i * 0.35}s` }">
					<PixelIcon
						:icon="item.icon"
						:palette="item.palette"
						:size="34" />
				</span>
			</div>
		</template>

		<!-- Habity: siatka kafelków, część odhaczona -->
		<template v-else-if="slide === 'habits'">
			<div class="mock">
				<div class="mock-tiles">
					<span
						v-for="tile in tiles"
						:key="tile.icon"
						class="mini-tile"
						:class="{ done: tile.done, tap: tile.tap }"
						:style="{ '--tint': tint(tile.palette) }">
						<PixelIcon
							:icon="tile.icon"
							:palette="tile.palette"
							:size="30" />
						<span
							v-if="tile.done"
							class="mini-check"
							>✓</span
						>
						<span
							v-if="tile.tap"
							class="tap-ring"></span>
					</span>
				</div>
				<div class="mock-progress">
					<span class="mock-track"><span style="width: 50%"></span></span>
					<span class="mock-caption">3 of 6 today</span>
				</div>
			</div>
		</template>

		<!-- Dni: wybór dnia i pasek tygodnia -->
		<template v-else-if="slide === 'days'">
			<div class="mock">
				<div class="mock-picker">
					<span class="mock-arrow"><i class="pi pi-chevron-left"></i></span>
					<span class="mock-day">
						<strong>Saturday</strong>
						<small>11 October</small>
					</span>
					<span class="mock-arrow"><i class="pi pi-chevron-right"></i></span>
				</div>
				<div class="mock-week">
					<span
						v-for="day in week"
						:key="day.label"
						class="week-day"
						:class="{ active: day.active }">
						<small>{{ day.label }}</small>
						<span
							class="week-dot"
							:style="{ '--fill': `${day.fill * 100}%` }"></span>
					</span>
				</div>
			</div>
		</template>

		<!-- To-do: krótka lista -->
		<template v-else-if="slide === 'todos'">
			<div class="mock mock-list">
				<span
					v-for="todo in todos"
					:key="todo.text"
					class="todo-row"
					:class="{ done: todo.done }">
					<span class="todo-box"><i
						v-if="todo.done"
						class="pi pi-check"></i></span>
					<span class="todo-text">{{ todo.text }}</span>
				</span>
			</div>
		</template>

		<!-- Postępy: seria, mapa miesiąca, odznaka -->
		<template v-else-if="slide === 'progress'">
			<div class="mock mock-progress-grid">
				<span class="streak">
					<PixelIcon
						icon="local_fire_department"
						palette="orange"
						:size="44" />
					<strong>12</strong>
					<small>day streak</small>
				</span>
				<span class="heat">
					<span
						v-for="(level, i) in heat"
						:key="i"
						class="heat-cell"
						:style="{ '--lvl': level }"></span>
				</span>
				<span class="medal">
					<PixelIcon
						icon="trophy"
						palette="yellow"
						:size="36" />
				</span>
			</div>
		</template>

		<!-- Znajomi: awatary i piątka -->
		<template v-else>
			<div class="mock mock-friends">
				<span
					v-for="friend in friends"
					:key="friend.name"
					class="friend">
					<PixelAvatar
						:avatar="friend.avatar"
						:size="52" />
					<small>{{ friend.name }}</small>
					<span class="friend-bars">
						<span
							v-for="(h, i) in friend.week"
							:key="i"
							:style="{ height: `${h * 100}%` }"></span>
					</span>
				</span>
				<span class="cheer">👏</span>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import PixelIcon from "@/components/ui/PixelIcon.vue";
import PixelAvatar from "@/components/ui/PixelAvatar.vue";
import { PALETTES, type PaletteKey } from "@/utils/pixelIcons";
import { defaultAvatar } from "@/utils/avatar";
import type { HelpSlideId } from "@/utils/onboarding";

defineProps<{ slide: HelpSlideId }>();

const tint = (palette: PaletteKey) => PALETTES[palette].h;

const orbit: Array<{ icon: string; palette: PaletteKey }> = [
	{ icon: "water_drop", palette: "blue" },
	{ icon: "menu_book", palette: "purple" },
	{ icon: "directions_walk", palette: "green" },
	{ icon: "self_improvement", palette: "teal" },
	{ icon: "bedtime", palette: "indigo" },
	{ icon: "favorite", palette: "red" },
];

const tiles: Array<{ icon: string; palette: PaletteKey; done?: boolean; tap?: boolean }> = [
	{ icon: "water_drop", palette: "blue", done: true },
	{ icon: "directions_walk", palette: "green", done: true },
	{ icon: "menu_book", palette: "purple", done: true },
	{ icon: "self_improvement", palette: "teal", tap: true },
	{ icon: "fitness_center", palette: "red" },
	{ icon: "bedtime", palette: "indigo" },
];

const week = [
	{ label: "M", fill: 1 },
	{ label: "T", fill: 0.6 },
	{ label: "W", fill: 1 },
	{ label: "T", fill: 0.3 },
	{ label: "F", fill: 0.8 },
	{ label: "S", fill: 1, active: true },
	{ label: "S", fill: 0 },
];

const todos = [
	{ text: "Clean the fridge", done: true },
	{ text: "Book the dentist", done: false },
	{ text: "Buy a birthday card", done: false },
];

const heat = [
	3, 2, 3, 1, 0, 2, 3, 2, 3, 3, 1, 2, 3, 3, 0, 1, 2, 3, 3, 2, 3, 3, 2, 1, 3, 3, 3, 2,
];

const friends = [
	{ name: "Ola", avatar: defaultAvatar("ola-help"), week: [0.4, 0.8, 1, 0.6, 1, 0.7, 0.9] },
	{ name: "You", avatar: defaultAvatar("you-help"), week: [1, 0.6, 0.9, 1, 0.5, 1, 0.8] },
	{ name: "Kuba", avatar: defaultAvatar("kuba-help"), week: [0.7, 1, 0.5, 0.9, 0.6, 0.4, 1] },
];
</script>

<style scoped>
.ill {
	position: relative;
	display: grid;
	place-items: center;
	min-height: 13rem;
	padding: 1rem 0;
	border-radius: var(--dt-radius-lg);
	background:
		radial-gradient(circle at 50% 40%, var(--dt-accent-softer), transparent 70%),
		var(--dt-surface-soft);
	overflow: hidden;
}

/* --- Powitanie --- */
.orbit {
	position: relative;
	width: 11rem;
	height: 11rem;
	display: grid;
	place-items: center;
}
.orbit-logo {
	width: 5.5rem;
	height: 5.5rem;
	image-rendering: pixelated;
}
.orbit-icon {
	position: absolute;
	top: 50%;
	left: 50%;
	display: grid;
	place-items: center;
	width: 2.9rem;
	height: 2.9rem;
	margin: -1.45rem 0 0 -1.45rem;
	border-radius: 0.9rem;
	background: var(--dt-surface);
	box-shadow: var(--dt-shadow-sm);
	transform: rotate(var(--a)) translateY(-4.6rem) rotate(calc(-1 * var(--a)));
	animation: bob 3s ease-in-out var(--d) infinite;
}
@keyframes bob {
	50% {
		translate: 0 -0.3rem;
	}
}

/* --- Wspólna „karta” --- */
.mock {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: min(100% - 2rem, 17rem);
	padding: 0.9rem;
	border-radius: var(--dt-radius-lg);
	background: var(--dt-surface);
	border: 1px solid var(--dt-border);
	box-shadow: var(--dt-shadow-sm);
}

/* --- Habity --- */
.mock-tiles {
	display: grid;
	width: min(100%, 12.5rem);
	margin: 0 auto;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
}
.mini-tile {
	position: relative;
	display: grid;
	place-items: center;
	aspect-ratio: 1;
	border-radius: 0.9rem;
	background: color-mix(in srgb, var(--tint) 30%, var(--dt-surface));
	border: 1px solid color-mix(in srgb, var(--tint) 55%, var(--dt-border));
}
.mini-tile.done {
	background: color-mix(in srgb, var(--tint) 60%, var(--dt-surface));
}
.mini-check {
	position: absolute;
	top: -0.35rem;
	right: -0.35rem;
	display: grid;
	place-items: center;
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 50%;
	font-size: 0.7rem;
	font-weight: 800;
	color: var(--dt-on-accent);
	background: var(--dt-accent-strong);
	box-shadow: 0 0 0 2px var(--dt-surface);
}
.tap-ring {
	position: absolute;
	inset: -0.2rem;
	border-radius: 1.05rem;
	border: 2px solid var(--dt-accent);
	animation: tap 1.6s ease-out infinite;
}
@keyframes tap {
	0% {
		opacity: 0.9;
		transform: scale(0.9);
	}
	100% {
		opacity: 0;
		transform: scale(1.15);
	}
}
.mock-progress {
	display: flex;
	align-items: center;
	gap: 0.6rem;
}
.mock-track {
	flex: 1;
	height: 0.45rem;
	border-radius: var(--dt-radius-pill);
	background: var(--dt-surface-sunken);
	overflow: hidden;
}
.mock-track span {
	display: block;
	height: 100%;
	border-radius: inherit;
	background: var(--dt-accent);
}
.mock-caption {
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-2);
}

/* --- Dni --- */
.mock-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}
.mock-arrow {
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	font-size: 0.7rem;
	color: var(--dt-accent-ink);
	background: var(--dt-accent-soft);
}
.mock-day {
	display: flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.2;
}
.mock-day strong {
	font-size: var(--dt-text-md);
	color: var(--dt-text);
}
.mock-day small {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.mock-week {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 0.25rem;
}
.week-day {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	padding: 0.35rem 0;
	border-radius: 0.7rem;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-3);
}
.week-day.active {
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
}
.week-dot {
	width: 1.1rem;
	height: 1.1rem;
	border-radius: 50%;
	background: conic-gradient(var(--dt-accent) var(--fill), var(--dt-surface-sunken) 0);
}

/* --- To-do --- */
.mock-list {
	gap: 0.45rem;
}
.todo-row {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.5rem 0.6rem;
	border-radius: var(--dt-radius);
	background: var(--dt-surface-soft);
	font-size: var(--dt-text-sm);
	font-weight: 600;
	color: var(--dt-text);
}
.todo-box {
	display: grid;
	place-items: center;
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 0.4rem;
	border: 2px solid var(--dt-border-strong);
	font-size: 0.6rem;
	flex-shrink: 0;
}
.todo-row.done .todo-box {
	border-color: var(--dt-accent-strong);
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
}
.todo-row.done .todo-text {
	text-decoration: line-through;
	color: var(--dt-text-3);
}

/* --- Postępy --- */
.mock-progress-grid {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
.streak {
	display: flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
}
.streak strong {
	font-size: 1.4rem;
	color: var(--dt-text);
}
.streak small {
	font-size: var(--dt-text-xs);
	color: var(--dt-text-3);
}
.heat {
	display: grid;
	grid-template-columns: repeat(7, 0.75rem);
	gap: 0.2rem;
}
.heat-cell {
	width: 0.75rem;
	height: 0.75rem;
	border-radius: 0.2rem;
	background: color-mix(in srgb, var(--dt-accent) calc(var(--lvl) * 30%), var(--dt-surface-sunken));
}
.medal {
	display: grid;
	place-items: center;
	width: 3.2rem;
	height: 3.2rem;
	border-radius: 50%;
	background: radial-gradient(
		circle at 35% 30%,
		color-mix(in srgb, var(--dt-gold) 12%, var(--dt-surface)),
		color-mix(in srgb, var(--dt-gold) 40%, var(--dt-surface))
	);
	box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dt-gold) 60%, transparent);
}

/* --- Znajomi --- */
.mock-friends {
	position: relative;
	flex-direction: row;
	justify-content: space-around;
}
.friend {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	font-size: var(--dt-text-xs);
	font-weight: 700;
	color: var(--dt-text-2);
}
.friend-bars {
	display: flex;
	align-items: flex-end;
	gap: 2px;
	height: 1.4rem;
}
.friend-bars span {
	width: 0.3rem;
	border-radius: 2px;
	background: var(--dt-accent);
}
.cheer {
	position: absolute;
	top: -0.9rem;
	right: -0.6rem;
	display: grid;
	place-items: center;
	width: 2.4rem;
	height: 2.4rem;
	border-radius: 50%;
	font-size: 1.25rem;
	background: var(--dt-surface);
	border: 1px solid var(--dt-border);
	box-shadow: var(--dt-shadow-sm);
	animation: bob 2.4s ease-in-out infinite;
}
</style>
