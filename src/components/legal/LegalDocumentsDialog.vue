<template>
	<Dialog
		v-model:visible="isVisible"
		modal
		dismissableMask
		closable
		class="w-[min(96vw,56rem)] legal-dialog"
		:pt="{ mask: { class: 'dt-dialog-mask' } }"
		:draggable="false"
		:header="activeDocument === 'privacy' ? m.privacyPolicy : m.termsOfService">
		<div
			class="dt-segmented legal-switch"
			role="group"
			:aria-label="m.documentLabel">
			<button
				type="button"
				:aria-pressed="activeDocument === 'privacy'"
				@click="activeDocument = 'privacy'">
				{{ m.privacyPolicy }}
			</button>
			<button
				type="button"
				:aria-pressed="activeDocument === 'terms'"
				@click="activeDocument = 'terms'">
				{{ m.termsOfService }}
			</button>
		</div>

		<div class="max-h-[62vh] overflow-y-auto pr-1 text-sm leading-6 text-b">
			<section class="space-y-4">
				<p>{{ doc.intro }}</p>
				<template
					v-for="section in doc.sections"
					:key="section.heading">
					<h4 class="font-semibold text-a">{{ section.heading }}</h4>
					<p
						v-for="(paragraph, i) in section.paragraphs"
						:key="i">
						{{ paragraph }}
					</p>
				</template>
			</section>
		</div>

		<template #footer>
			<div class="flex justify-end">
				<button
					type="button"
					class="dt-btn dt-btn-outline dt-btn-sm"
					@click="isVisible = false">
					{{ m.close }}
				</button>
			</div>
		</template>

	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import { legalMessages as m } from "@/i18n/messages/legal";

type LegalDocumentType = "privacy" | "terms";

const isVisible = ref(false);
const activeDocument = ref<LegalDocumentType>("privacy");
// Treść dokumentu w aktualnym języku
const doc = computed(() => (activeDocument.value === "privacy" ? m.privacy : m.terms));

function open(document: LegalDocumentType) {
	activeDocument.value = document;
	isVisible.value = true;
}

defineExpose({
	open,
});
</script>

<style scoped>
.legal-switch {
	margin-bottom: 1rem;
}
</style>