<template>
	<div
		class="hi-root"
		:class="{ 'hi-labeled': props.showLabel }"
		@click="handleClick"
		v-tooltip.bottom="tooltipValue">
		<div
			class="hi-btn"
			:class="[severityClass, { 'hi-add': isAddButton }]">
			<span class="material-icons material-symbols-outlined hi-icon">
				{{ data.icon }}
			</span>

			<Transition name="hi-badge">
				<span
					v-if="showCheckBadge || (count && count > 1)"
					class="hi-check-badge">
					<span
						v-if="count && count > 1"
						style="font-size: 0.7rem; font-weight: bold; color: white">
						{{ count }}
					</span>
					<i
						v-else
						class="pi pi-check"
						style="font-size: 0.5rem; color: white"></i>
				</span>
			</Transition>
		</div>
		<span
			v-if="props.showLabel"
			class="hi-label">
			{{ data.display_name || data.name }}
		</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Habbit } from "@/libs/types";

const props = defineProps<{
	data: Habbit;
	showLabel?: boolean;
	showTooltip?: boolean;
	showCheckBadge?: boolean;
	count?: number; // <--- Dodaj tę linijkę
}>();
const emit = defineEmits(["select", "click"]);

const isAddButton = computed(() => props.data.icon === "add");

const severityClass = computed(() => {
	const s = props.data.severity;
	if (s === "success") return "hi-success";
	if (s === "danger") return "hi-danger";
	if (s === "empty") return "hi-empty";
	return "hi-default";
});

const tooltipValue = computed(() => {
	if (props.showTooltip === false) return false;
	if (props.data.icon === "add") return false;
	return props.data.display_name || props.data.name || false;
});

function handleClick() {
	emit("select", props.data);
	emit("click", props.data);
}
</script>

<style scoped>
/* Root wrapper */
.hi-root {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 3.25rem;
	cursor: pointer;
	user-select: none;
	-webkit-tap-highlight-color: transparent;
}
.hi-root.hi-labeled {
	width: 4rem;
}

.hi-badge-text {
	font-size: 0.65rem;
	font-weight: 700;
	color: white;
	line-height: 1;
}

/* The squircle icon button */
.hi-btn {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	border-radius: 0.85rem;
	transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* Hover & active micro-interactions */
.hi-btn:hover {
	transform: scale(1.08);
}
.hi-btn:active {
	transform: scale(0.92);
	transition-duration: 0.1s;
}

/* ===== Severity: SUCCESS (tracked habit) ===== */
.hi-success {
	background: color-mix(in srgb, var(--p-green-100) 55%, var(--p-orange-50));
	box-shadow: 0 2px 8px color-mix(in srgb, var(--p-green-300) 18%, transparent);
}
.hi-success .hi-icon {
	color: var(--p-green-600);
}
.hi-success:hover {
	background: color-mix(in srgb, var(--p-green-100) 75%, var(--p-orange-50));
	box-shadow: 0 4px 14px color-mix(in srgb, var(--p-green-300) 28%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hi-success {
	background: color-mix(in srgb, var(--p-green-900) 35%, transparent);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
:where(.my-app-dark, .my-app-dark *) .hi-success .hi-icon {
	color: var(--p-green-400);
}
:where(.my-app-dark, .my-app-dark *) .hi-success:hover {
	background: color-mix(in srgb, var(--p-green-800) 40%, transparent);
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

/* ===== Severity: DANGER (negative habit / delete) ===== */
.hi-danger {
	background: color-mix(in srgb, var(--p-red-100) 50%, var(--p-orange-50));
	box-shadow: 0 2px 8px color-mix(in srgb, var(--p-red-300) 15%, transparent);
}
.hi-danger .hi-icon {
	color: var(--p-red-500);
}
.hi-danger:hover {
	background: color-mix(in srgb, var(--p-red-100) 70%, var(--p-orange-50));
	box-shadow: 0 4px 14px color-mix(in srgb, var(--p-red-300) 25%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hi-danger {
	background: color-mix(in srgb, var(--p-red-900) 30%, transparent);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
:where(.my-app-dark, .my-app-dark *) .hi-danger .hi-icon {
	color: var(--p-red-400);
}
:where(.my-app-dark, .my-app-dark *) .hi-danger:hover {
	background: color-mix(in srgb, var(--p-red-800) 35%, transparent);
}

/* ===== Severity: EMPTY (unfulfilled goal / add button) ===== */
.hi-empty {
	background: transparent;
	border: 2px dashed var(--p-orange-200);
}
.hi-empty .hi-icon {
	color: var(--p-gray-400);
	font-size: 20px;
}
.hi-empty:hover {
	border-color: var(--p-orange-300);
	background: color-mix(in srgb, var(--p-orange-50) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hi-empty {
	border-color: var(--p-gray-600);
}
:where(.my-app-dark, .my-app-dark *) .hi-empty .hi-icon {
	color: var(--p-gray-500);
}
:where(.my-app-dark, .my-app-dark *) .hi-empty:hover {
	border-color: var(--p-gray-500);
	background: color-mix(in srgb, var(--p-gray-700) 40%, transparent);
}

/* Add button — warmer accent */
.hi-add .hi-icon {
	color: var(--p-orange-400);
	font-size: 22px;
}
.hi-add:hover {
	border-color: var(--p-orange-400);
	background: color-mix(in srgb, var(--p-orange-100) 40%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hi-add .hi-icon {
	color: var(--p-orange-500);
}
:where(.my-app-dark, .my-app-dark *) .hi-add:hover {
	border-color: var(--p-orange-600);
}

/* Default / fallback */
.hi-default {
	background: var(--p-orange-50);
}
.hi-default .hi-icon {
	color: var(--p-gray-600);
}
:where(.my-app-dark, .my-app-dark *) .hi-default {
	background: color-mix(in srgb, var(--p-gray-700) 50%, transparent);
}
:where(.my-app-dark, .my-app-dark *) .hi-default .hi-icon {
	color: var(--p-gray-400);
}

/* Icon */
.hi-icon {
	font-size: 22px;
	line-height: 1;
	transition: color 0.2s ease;
}

/* Label below icon */
.hi-label {
	font-family: "Lora", serif;
	font-size: 0.65rem;
	font-weight: 500;
	color: var(--p-gray-500);
	text-align: center;
	margin-top: 0.3rem;
	line-height: 1.2;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
:where(.my-app-dark, .my-app-dark *) .hi-label {
	color: var(--p-gray-400);
}

/* ===== Check badge (ukończony cel) ===== */
.hi-check-badge {
	position: absolute;
	top: -0.3rem;
	right: -0.3rem;
	width: 1.05rem;
	height: 1.05rem;
	border-radius: 9999px;
	background: var(--p-green-500);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 4px color-mix(in srgb, var(--p-green-500) 35%, transparent);
	z-index: 2;
}
.hi-check-badge .pi-check {
	font-size: 0.5rem;
	color: white;
	line-height: 1;
	display: flex;
}
:where(.my-app-dark, .my-app-dark *) .hi-check-badge {
	background: var(--p-green-600);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

/* Badge animation */
.hi-badge-enter-active {
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hi-badge-leave-active {
	transition: all 0.15s ease;
}
.hi-badge-enter-from {
	opacity: 0;
	transform: scale(0.3);
}
.hi-badge-leave-to {
	opacity: 0;
	transform: scale(0.5);
}
</style>

<!-- Tooltip global styles (PrimeVue renders tooltips outside component) -->
<style>
.p-tooltip {
	background: transparent !important;
	box-shadow: none !important;
	border: none !important;
	margin-top: 7px;
	margin-bottom: 7px;
}

.p-tooltip .p-tooltip-text {
	font-size: 0.8rem;
	font-style: italic;
	border-radius: 5px;
	padding: 2px 6px;
	background: rgba(0, 0, 0, 0.7);
	color: #fff;
}
</style>
