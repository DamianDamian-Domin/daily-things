<template>
	<Dialog
		v-model:visible="visible"
		modal
		dismissableMask
		:closable="true"
		:showHeader="false"
		class="profile-dialog w-[clamp(22rem,90vw,30rem)] pt-4">
		<ProfileContent :isVisible="visible" />
	</Dialog>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog";
// Pamiętaj o dostosowaniu ścieżki importu, jeśli pliki są w innych folderach
import ProfileContent from "@/components/login_view/ProfileContent.vue";

// Model sterujący widocznością okna Dialog z komponentu nadrzędnego (np. TopBar na desktopie)
const visible = defineModel<boolean>({ default: false });
</script>

<style scoped>
/* Cały kod CSS profilu żyje teraz w ProfileContent.vue.
  Tutaj zostawiamy tylko style dotyczące samego kontenera okna (Dialogu), jeśli jakieś są potrzebne.
*/
:deep(.profile-dialog.p-dialog) {
	border-radius: 1.15rem !important;
	overflow: hidden;
}
:deep(.profile-dialog .p-dialog-content) {
	padding: 0 !important;
}
</style>
