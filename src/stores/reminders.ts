import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import type { HabitReminder } from "@/libs/types";
import { saveUserFields, type UserDoc } from "@/services/userData";
import { useAuthStore } from "@/stores/auth";
import { useHabitsStore } from "@/stores/habits";
import { useToastStore } from "@/stores/toast";
import { displayName } from "@/utils/habitCatalog";
import { isNativePlatform } from "@/utils/platform";
import { addDays, startOfDay } from "@/utils/date";

// Planujemy pojedyncze powiadomienia na kilka dni do przodu zamiast jednego
// powtarzalnego — dzięki temu dzisiejsze przypomnienie znika, gdy cel jest
// już zrobiony. Każde otwarcie aplikacji przesuwa to okno dalej.
const DAYS_AHEAD = 7;
const CHANNEL_ID = "habit-reminders";
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const SAVE_ERROR = "Couldn't save that reminder — check your connection and try again.";

export type ReminderPermission = "granted" | "denied" | "prompt" | "unsupported";

function isValid(r: unknown): r is HabitReminder {
	const item = r as HabitReminder;
	return typeof item?.name === "string" && typeof item?.time === "string" && TIME_RE.test(item.time);
}

// Wtyczka ładowana leniwie — na webie nigdy jej nie pobieramy
const loadPlugin = () =>
	import("@capacitor/local-notifications").then((m) => m.LocalNotifications);

export const useRemindersStore = defineStore("reminders", () => {
	const authStore = useAuthStore();
	const habitsStore = useHabitsStore();
	const toast = useToastStore();

	const reminders = ref<HabitReminder[]>([]);
	const permission = ref<ReminderPermission>(isNativePlatform ? "prompt" : "unsupported");

	const byName = computed(() => new Map(reminders.value.map((r) => [r.name, r.time])));

	function timeFor(name: string): string | null {
		return byName.value.get(name) ?? null;
	}

	// Przypomnienia dotyczą tylko aktualnych celów — po usunięciu celu wpis
	// zostaje (wróci razem z celem), ale nic nie dzwoni
	const activeReminders = computed(() => {
		const goals = new Set(habitsStore.dailyGoalsList.map((g) => g.name));
		return reminders.value.filter((r) => goals.has(r.name));
	});

	function hydrate(userDoc: UserDoc) {
		reminders.value = Array.isArray(userDoc.reminders) ? userDoc.reminders.filter(isValid) : [];
		refreshPermission();
	}

	// ==========================================================================
	// ZAPIS (optymistyczny)
	// ==========================================================================
	async function setReminder(name: string, time: string | null) {
		const currentUid = authStore.userUid;
		if (!currentUid) return;
		if (time !== null && !TIME_RE.test(time)) return;
		const previous = reminders.value;
		const rest = previous.filter((r) => r.name !== name);
		reminders.value = time ? [...rest, { name, time }] : rest;
		if (time) ensurePermission();
		try {
			await saveUserFields(currentUid, { reminders: reminders.value.map((r) => ({ ...r })) });
		} catch (err) {
			console.error("setReminder failed", err);
			if (authStore.userUid === currentUid) reminders.value = previous;
			toast.error(SAVE_ERROR);
		}
	}

	// ==========================================================================
	// UPRAWNIENIA
	// ==========================================================================
	async function refreshPermission() {
		if (!isNativePlatform) return;
		try {
			const plugin = await loadPlugin();
			permission.value = mapPermission((await plugin.checkPermissions()).display);
		} catch (err) {
			console.warn("Notification permission check failed", err);
		}
	}

	// Pytamy dopiero, gdy użytkownik sam ustawi pierwszą godzinę
	async function ensurePermission(): Promise<boolean> {
		if (!isNativePlatform) return false;
		if (permission.value === "granted") return true;
		try {
			const plugin = await loadPlugin();
			const status = await plugin.requestPermissions();
			permission.value = mapPermission(status.display);
		} catch (err) {
			console.warn("Notification permission request failed", err);
		}
		if (permission.value !== "granted") {
			toast.error("Notifications are off for Daily Things. Turn them on in your phone's settings.");
			return false;
		}
		scheduleSoon();
		return true;
	}

	function mapPermission(state: string): ReminderPermission {
		if (state === "granted") return "granted";
		if (state === "denied") return "denied";
		return "prompt";
	}

	// ==========================================================================
	// PLANOWANIE POWIADOMIEŃ (tylko Android)
	// ==========================================================================
	let channelReady = false;
	let running: Promise<void> | null = null;
	let again = false;

	function buildNotifications() {
		const now = Date.now();
		const today = startOfDay();
		const counts = habitsStore.countsOn(habitsStore.todayKey);
		const notifications = [];
		let id = 1;
		for (const reminder of activeReminders.value) {
			const goals = habitsStore.dailyGoalsList.filter((g) => g.name === reminder.name);
			const habit = habitsStore.resolve(goals[0]);
			const target = goals.length;
			const doneToday = (counts[reminder.name] ?? 0) >= target;
			const [hour, minute] = reminder.time.split(":").map(Number);
			const name = displayName(habit);
			for (let d = 0; d < DAYS_AHEAD; d++) {
				const at = addDays(today, d);
				at.setHours(hour, minute, 0, 0);
				if (at.getTime() <= now || (d === 0 && doneToday)) {
					id++;
					continue;
				}
				notifications.push({
					id: id++,
					title: `${name} ⏰`,
					body:
						target > 1
							? `Time for it! Your goal is ${target}× today. Small steps count 🌱`
							: "Time for it! Small steps count 🌱",
					channelId: CHANNEL_ID,
					schedule: { at, allowWhileIdle: true },
					extra: { habit: reminder.name },
				});
			}
		}
		return notifications;
	}

	async function reschedule() {
		const plugin = await loadPlugin();
		if (!channelReady) {
			await plugin.createChannel({
				id: CHANNEL_ID,
				name: "Habit reminders",
				description: "Nudges at the times you set for your daily goals",
				importance: 4,
			});
			channelReady = true;
		}
		const pending = await plugin.getPending();
		if (pending.notifications.length) {
			await plugin.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
		}
		if (!authStore.userUid || permission.value !== "granted") return;
		const notifications = buildNotifications();
		if (notifications.length) await plugin.schedule({ notifications });
	}

	// Kolejne zmiany w trakcie planowania sklejamy w jedno ponowne przeliczenie
	async function run() {
		if (running) {
			again = true;
			return running;
		}
		running = (async () => {
			do {
				again = false;
				try {
					await reschedule();
				} catch (err) {
					console.warn("Reminder scheduling failed", err);
				}
			} while (again);
		})().finally(() => (running = null));
		return running;
	}

	let timer: ReturnType<typeof setTimeout> | null = null;
	function scheduleSoon() {
		if (!isNativePlatform) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(run, 800);
	}

	if (isNativePlatform) {
		// Sygnatura tego, co wpływa na harmonogram: godziny, cele, dzisiejsze postępy, dzień
		watch(
			() => {
				const counts = habitsStore.countsOn(habitsStore.todayKey);
				return JSON.stringify([
					habitsStore.todayKey,
					activeReminders.value,
					habitsStore.dailyGoalsList.map((g) => g.name),
					activeReminders.value.map((r) => counts[r.name] ?? 0),
					permission.value,
				]);
			},
			scheduleSoon,
		);
		// Powrót do aplikacji: uprawnienie mogło się zmienić w ustawieniach,
		// a okno planowania przesuwa się o kolejny dzień
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible" && authStore.userUid) {
				refreshPermission().then(scheduleSoon);
			}
		});
	}

	// Wylogowanie / zmiana konta: czyścimy stan i zaplanowane powiadomienia
	function clear() {
		reminders.value = [];
		scheduleSoon();
	}

	return {
		reminders,
		activeReminders,
		permission,
		timeFor,
		hydrate,
		setReminder,
		ensurePermission,
		clear,
	};
});
