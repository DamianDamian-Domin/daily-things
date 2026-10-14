<template>
	<!-- Jedno pole: obramowanie i fokus ma cały wiersz, nie samo <input> -->
	<form
		class="add-row"
		@submit.prevent="submitNew">
		<label
			for="new-todo"
			class="add-plus">
			<i
				class="pi pi-plus"
				aria-hidden="true"></i>
			<span class="sr-only">{{ m.newTask }}</span>
		</label>
		<input
			id="new-todo"
			ref="newInputRef"
			v-model="newText"
			class="add-input"
			:placeholder="m.addPlaceholder"
			autocomplete="off"
			enterkeyhint="done"
			@keydown.escape="newText = ''" />
		<button
			v-if="newText.trim()"
			type="submit"
			class="dt-btn dt-btn-primary dt-btn-sm">
			{{ m.add }}
		</button>
	</form>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { useTodosStore } from "@/stores/todos";
import { useSound } from "@/utils/useSound";
import { todosMessages as m } from "@/i18n/messages/todos";

const todosStore = useTodosStore();
const { playAdd } = useSound();

// ==========================================
// DODAWANIE
// ==========================================
const newText = ref("");
const newInputRef = ref<HTMLInputElement | null>(null);

async function submitNew() {
	const text = newText.value.trim();
	if (!text) return;
	playAdd();
	newText.value = "";
	await todosStore.addTodo(text);
	nextTick(() => newInputRef.value?.focus());
}
</script>

<style scoped>
/* Pole „Dodaj zadanie”: jedna ramka i jeden pierścień fokusu dla całego wiersza */
.add-row {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.2rem 0.3rem 0.2rem 0.2rem;
	border-radius: var(--dt-radius-lg);
	border: 1.5px dashed var(--dt-border-strong);
	background: var(--dt-surface-soft);
	transition:
		border-color var(--dt-t-fast) ease,
		background-color var(--dt-t-fast) ease,
		box-shadow var(--dt-t-fast) ease;
}
.add-row:focus-within {
	border-style: solid;
	border-color: var(--dt-accent);
	background: var(--dt-surface);
	box-shadow: var(--dt-focus-ring);
}
/* „+” to etykieta pola — kliknięcie w nią ustawia kursor w polu */
.add-plus {
	display: grid;
	place-items: center;
	width: 2.5rem;
	height: 2.5rem;
	flex-shrink: 0;
	border-radius: 50%;
	cursor: text;
}
.add-plus i {
	display: grid;
	place-items: center;
	width: 1.9rem;
	height: 1.9rem;
	border-radius: 50%;
	background: var(--dt-accent-soft);
	color: var(--dt-accent-ink);
	font-size: 0.75rem;
	transition:
		background-color var(--dt-t-fast) ease,
		color var(--dt-t-fast) ease,
		transform var(--dt-t) var(--dt-spring);
}
.add-row:focus-within .add-plus i {
	background: var(--dt-accent-strong);
	color: var(--dt-on-accent);
	transform: rotate(90deg);
}
.add-input {
	flex: 1;
	min-width: 0;
	min-height: 2.5rem;
	padding: 0;
	border: none;
	background: transparent;
	font-family: var(--dt-font);
	font-size: 1rem;
	color: var(--dt-text);
	outline: none;
}
/* Fokus pokazuje cały wiersz — samo pole nie dokłada drugiego obrysu */
.add-input:focus-visible {
	outline: none;
	box-shadow: none;
}
.add-input::placeholder {
	color: var(--dt-text-3);
}
@media (hover: hover) {
	.add-row:hover:not(:focus-within) {
		border-color: var(--dt-hover-border);
		background: var(--dt-hover-bg);
	}
	.add-row:hover:not(:focus-within) .add-plus i {
		background: color-mix(in srgb, var(--dt-accent) 26%, var(--dt-surface));
	}
}
</style>
