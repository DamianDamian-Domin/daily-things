<template>
	<Dialog
		v-model:visible="authStore.isGuestInfoModalOpen"
		modal
		header="Don't lose your progress!"
		:style="{ width: '90%', maxWidth: '400px' }"
		:dismissableMask="true"
		:closable="false">
		<div class="flex flex-col gap-4 text-surface-700 dark:text-surface-300">
			<p class="m-0 leading-relaxed">
				You are currently using a temporary guest account. Create a free account
				to permanently save your habits and access them safely on any device.
			</p>

			<div
				class="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl border border-orange-200 dark:border-orange-800/50">
				<i class="pi pi-clock text-xl"></i>
				<span class="font-medium">
					Your guest account will expire in
					<span class="font-bold text-orange-600 dark:text-orange-300"
						>{{ authStore.guestDaysRemaining }} days</span
					>.
				</span>
			</div>
		</div>

		<template #footer>
			<div class="flex gap-2 w-full mt-2">
				<button
					class="flex-1 px-4 py-2 bg-transparent text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 rounded-lg transition-colors font-medium cursor-pointer border-none"
					@click="authStore.isGuestInfoModalOpen = false">
					Maybe later
				</button>
				<button
					class="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-semibold cursor-pointer border-none shadow-sm"
					@click="proceedToAuth">
					Create Account
				</button>
			</div>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import Dialog from "primevue/dialog";

const authStore = useAuthStore();

// Zamykamy info i otwieramy logowanie
const proceedToAuth = () => {
	authStore.isGuestInfoModalOpen = false;
	authStore.isAuthDialogOpen = true;
};
</script>
