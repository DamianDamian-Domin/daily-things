<template>
	<section
		class="todos dt-card"
		:class="{ 'is-inactive': !isActive }"
		aria-labelledby="todos-title">
		<header class="todos-head">
			<div>
				<h2
					id="todos-title"
					class="today-title">
					To-do list
					<span aria-hidden="true">📝</span>
				</h2>
				<p class="todos-sub">{{ subline }}</p>
			</div>
			<div
				v-if="totalCount > 0"
				class="dt-ring"
				:class="{ 'is-complete': allDone }"
				:style="{ '--pct': ringPct }"
				role="img"
				:aria-label="`${completedCount} of ${totalCount} tasks done`">
				<span aria-hidden="true">{{ completedCount }}/{{ totalCount }}</span>
			</div>
		</header>

		<TodoAddForm />

		<div class="todos-scroll">
			<draggable
				v-model="activeList"
				item-key="id"
				tag="ul"
				class="todo-list"
				ghost-class="todo-ghost"
				handle=".todo-main"
				:animation="160"
				:delay="200"
				:delay-on-touch-only="true"
				:touch-start-threshold="6">
				<template #item="{ element: todo }">
					<TodoItem
						v-model:new-step="inlineSub[todo.id]"
						:todo="todo"
						:expanded="expanded.has(todo.id)"
						@check="(e: Event) => onTodoCheck(todo, e)"
						@open="openDetails(todo)"
						@toggle-expand="toggleExpand(todo.id)"
						@toggle-sub="(subId: string) => toggleSub(todo, subId)"
						@add-sub="addSubInline(todo)" />
				</template>
			</draggable>

			<div
				v-if="totalCount === 0"
				class="dt-empty todos-empty">
				<PixelIcon
					icon="edit_note"
					palette="indigo"
					:size="44" />
				<p>Your list is clear. Add something small you'd like to get done.</p>
			</div>
			<p
				v-else-if="activeList.length === 0"
				class="all-clear">
				🎉 All clear! Nothing left on your list.
			</p>

			<!-- Ukończone -->
			<CompletedTodos
				v-if="completedTodos.length > 0"
				:todos="completedTodos"
				@toggle="toggle"
				@open="openDetails" />
		</div>

		<TodoDetailsDialog
			ref="detailsRef"
			@toggle-sub="toggleSub" />
	</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import draggable from "vuedraggable";
import type { TodoItem as Todo } from "@/libs/types";
import { useTodosStore } from "@/stores/todos";
import { useToastStore } from "@/stores/toast";
import { useSound } from "@/utils/useSound";
import { useConfetti } from "@/utils/useConfetti";
import { randomCheer } from "@/utils/useCompliment";
import PixelIcon from "@/components/ui/PixelIcon.vue";
import TodoAddForm from "./todos/TodoAddForm.vue";
import TodoItem from "./todos/TodoItem.vue";
import CompletedTodos from "./todos/CompletedTodos.vue";
import TodoDetailsDialog from "./todos/TodoDetailsDialog.vue";

defineProps<{ isActive: boolean }>();

const todosStore = useTodosStore();
const toast = useToastStore();
const { playCheck, playUncheck, playAdd, playVictory } = useSound();
const { launch: launchConfetti } = useConfetti();

// ==========================================
// LISTA
// ==========================================
const activeList = computed<Todo[]>({
	get: () => todosStore.activeTodos,
	set: (list) => todosStore.updateTodosOrder(list),
});
const completedTodos = computed(() => todosStore.completedTodos);
const totalCount = computed(() => todosStore.userTodosList.length);
const completedCount = computed(() => completedTodos.value.length);
const allDone = computed(() => totalCount.value > 0 && completedCount.value === totalCount.value);
const ringPct = computed(() =>
	totalCount.value ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
);

const subline = computed(() => {
	const left = activeList.value.length;
	if (totalCount.value === 0) return "One small thing at a time.";
	if (left === 0) return "Everything's ticked off. Lovely.";
	return `${left} ${left === 1 ? "thing" : "things"} left`;
});

// Konfetti, gdy lista zostaje w całości odhaczona — tylko po akcji użytkownika
let lastToggleAt = 0;
watch(allDone, (done, was) => {
	if (done && was === false && Date.now() - lastToggleAt < 2000) {
		playVictory();
		launchConfetti();
	}
});

// ==========================================
// ODHACZANIE
// ==========================================
async function toggle(todo: Todo, withSound = true) {
	lastToggleAt = Date.now();
	if (!todo.completed) {
		if (withSound) playCheck();
		const id = todo.id;
		await todosStore.toggleTodo(id);
		if (!allDone.value)
			toast.undoable(`Done — ${randomCheer()}`, () => todosStore.toggleTodo(id));
	} else {
		playUncheck();
		await todosStore.toggleTodo(todo.id);
	}
}

// Po odhaczeniu zadanie zostaje chwilę na miejscu, żeby było widać „pyknięcie”
// ptaszka, i dopiero wtedy zjeżdża do ukończonych. Ponowne kliknięcie w tej
// chwili cofa decyzję.
const TICK_DELAY_MS = 320;
const pendingTicks = new Map<string, number>();

function onTodoCheck(todo: Todo, event: Event) {
	const input = event.target as HTMLInputElement;
	const pending = pendingTicks.get(todo.id);
	if (pending !== undefined) {
		window.clearTimeout(pending);
		pendingTicks.delete(todo.id);
		return;
	}
	if (!input.checked) return;
	lastToggleAt = Date.now();
	playCheck();
	pendingTicks.set(
		todo.id,
		window.setTimeout(() => {
			pendingTicks.delete(todo.id);
			toggle(todo, false);
		}, TICK_DELAY_MS),
	);
}

// Karta znika (np. wylogowanie) — oczekujące odhaczenia zapisujemy od razu
onBeforeUnmount(() => {
	for (const [id, timer] of pendingTicks) {
		window.clearTimeout(timer);
		const todo = todosStore.userTodosList.find((t) => t.id === id);
		if (todo && !todo.completed) todosStore.toggleTodo(id);
	}
	pendingTicks.clear();
});

// ==========================================
// PODZADANIA NA LIŚCIE
// ==========================================
const expanded = reactive(new Set<string>());
const inlineSub = reactive<Record<string, string>>({});

function toggleExpand(id: string) {
	if (expanded.has(id)) expanded.delete(id);
	else expanded.add(id);
}

// Wspólne dla listy i okna szczegółów
async function toggleSub(todo: Todo, subId: string) {
	const sub = todo.subtasks?.find((s) => s.id === subId);
	if (!sub) return;
	if (!sub.done) playCheck();
	else playUncheck();
	await todosStore.toggleSubtask(todo.id, subId);
	const fresh = todosStore.userTodosList.find((t) => t.id === todo.id);
	// Wszystkie kroki zrobione → proponujemy zamknięcie zadania
	if (fresh && !fresh.completed && fresh.subtasks?.length && fresh.subtasks.every((s) => s.done)) {
		toast.show("All steps done! Complete the task?", {
			tone: "celebrate",
			actionLabel: "Complete",
			action: () => toggle(fresh),
			duration: 6000,
		});
	}
}

async function addSubInline(todo: Todo) {
	const text = inlineSub[todo.id]?.trim();
	if (!text) return;
	inlineSub[todo.id] = "";
	playAdd();
	await todosStore.addSubtask(todo.id, text);
}

// ==========================================
// SZCZEGÓŁY
// ==========================================
const detailsRef = ref<InstanceType<typeof TodoDetailsDialog> | null>(null);

function openDetails(todo: Todo) {
	detailsRef.value?.open(todo);
}
</script>

<style scoped>
.todos {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}
@media (min-width: 641px) {
	.todos {
		width: 30rem;
	}
}
.todos.is-inactive {
	pointer-events: none;
	user-select: none;
}

.todos-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}
.today-title {
	font-size: var(--dt-text-lg);
	font-weight: 700;
}
.todos-sub {
	margin: 0.2rem 0 0;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-3);
	font-style: italic;
}

.todos-scroll {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	margin: 0 -0.35rem;
	padding: 0 0.35rem 0.5rem;
	overscroll-behavior: contain;
}

.todo-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
}

.all-clear {
	margin: 0.75rem 0;
	text-align: center;
	font-size: var(--dt-text-sm);
	color: var(--dt-text-2);
}
.todos-empty {
	padding-top: 2rem;
}
.todos-empty p {
	max-width: 18rem;
	margin: 0.25rem 0 0;
	line-height: 1.5;
}
</style>
