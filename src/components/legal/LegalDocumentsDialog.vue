<template>
	<Dialog
		v-model:visible="isVisible"
		modal
		dismissableMask
		closable
		class="w-[min(96vw,56rem)]"
		:draggable="false"
		:header="activeDocument === 'privacy' ? 'Privacy Policy' : 'Terms of Service'">
		<div class="grid grid-cols-1 gap-2 pb-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
			<Button
				label="Privacy Policy"
				:size="'small'"
				class="legal-switch-btn"
				:severity="activeDocument === 'privacy' ? 'success' : 'secondary'"
				@click="activeDocument = 'privacy'" />
			<Button
				label="Terms of Service"
				:size="'small'"
				class="legal-switch-btn"
				:severity="activeDocument === 'terms' ? 'success' : 'secondary'"
				@click="activeDocument = 'terms'" />
			<div class="hidden sm:block"></div>
		</div>

		<div class="max-h-[62vh] overflow-y-auto pr-1 text-sm leading-6 text-b">
			<section
				v-if="activeDocument === 'privacy'"
				class="space-y-4">
				<p>
					This Privacy Policy explains the minimum necessary rules for personal
					data processing in Daily Things. It is prepared for a private
					individual publisher and aligned with GDPR and Polish data protection
					requirements.
				</p>

				<h4 class="font-semibold text-a">1. Data Controller</h4>
				<p>
					Controller: Damian Domin, private individual, based in Krakow, Poland.
					Contact: damian.domin334@gmail.com.
				</p>

				<h4 class="font-semibold text-a">2. Categories of Data</h4>
				<p>
					We process only data needed to provide the app: email/login identifier,
					optional display name/photo, and user content (habits, to-dos, goals,
					preferences).
				</p>

				<h4 class="font-semibold text-a">3. Purposes and Legal Bases (GDPR Art. 6)</h4>
				<p>
					To provide your account and app functions: Art. 6(1)(b) GDPR
					(contract).
				</p>
				<p>
					For security and abuse prevention: Art. 6(1)(f) GDPR (legitimate
					interest).
				</p>
				<p>
					Analytics and optional cookies: Art. 6(1)(a) GDPR (consent).
				</p>

				<h4 class="font-semibold text-a">4. Cookies and Similar Technologies</h4>
				<p>
					Essential storage/cookies are used for login and app settings.
					Optional analytics is off by default and can be enabled/disabled in
					Settings at any time.
				</p>

				<h4 class="font-semibold text-a">5. Data Recipients</h4>
				<p>
					Data is processed using service providers necessary to run the app
					(e.g., Firebase/Google Cloud for authentication and database) under
					appropriate data processing terms.
				</p>

				<h4 class="font-semibold text-a">6. International Data Transfers</h4>
				<p>
					If data is transferred outside the EEA, GDPR safeguards are used (e.g.,
					Standard Contractual Clauses).
				</p>

				<h4 class="font-semibold text-a">7. Retention Periods</h4>
				<p>
					Data is stored while your account is active and removed after deletion
					request, unless longer storage is required by law.
				</p>

				<h4 class="font-semibold text-a">8. Data Subject Rights</h4>
				<p>
					You can request access, rectification, erasure, restriction,
					portability, object to legitimate-interest processing, and withdraw
					consent.
				</p>
				<p>
					You can lodge a complaint with UODO (Poland): President of the Personal
					Data Protection Office, ul. Stawki 2, 00-193 Warsaw.
				</p>

				<h4 class="font-semibold text-a">9. Children</h4>
				<p>
					The app is not intended for children under the minimum age required by
					applicable law without parental consent.
				</p>

				<h4 class="font-semibold text-a">10. Policy Changes</h4>
				<p>
					This policy may be updated if required by law or service changes.
				</p>
			</section>

			<section
				v-else
				class="space-y-4">
				<p>
					These Terms define the basic rules of using Daily Things. They are
					kept intentionally short and include the minimum information required
					for an online service provided by a private individual.
				</p>

				<h4 class="font-semibold text-a">1. Service Provider</h4>
				<p>
					Provider: Damian Domin, private individual, based in Krakow, Poland.
					Contact: damian.domin334@gmail.com.
				</p>

				<h4 class="font-semibold text-a">2. Scope of Service</h4>
				<p>
					Daily Things lets users manage habits, to-dos and goals through an
					account-based app.
				</p>

				<h4 class="font-semibold text-a">3. Technical Requirements</h4>
				<p>
					A supported mobile device/browser, internet access and an email/login
					method are required.
				</p>

				<h4 class="font-semibold text-a">4. User Responsibilities</h4>
				<p>
					Users must keep their login credentials safe and use the app lawfully.
					Abuse, unauthorized access attempts and harmful content are prohibited.
				</p>

				<h4 class="font-semibold text-a">5. Fees</h4>
				<p>
					Current version: free of charge. If paid plans are introduced, pricing
					and billing terms will be published before purchase.
				</p>

				<h4 class="font-semibold text-a">6. Complaints and Contact</h4>
				<p>
					Complaints and support requests can be sent to damian.domin334@gmail.com. A
					response is provided without undue delay, usually within 14 days.
				</p>

				<h4 class="font-semibold text-a">7. Account Deletion</h4>
				<p>
					Users can stop using the app anytime and request account/data deletion.
				</p>

				<h4 class="font-semibold text-a">8. Liability</h4>
				<p>
					The service is provided with due care. Nothing in these Terms limits
					mandatory consumer rights under applicable law.
				</p>

				<h4 class="font-semibold text-a">9. Governing Law</h4>
				<p>
					Polish law applies, with mandatory consumer protections under EU law
					remaining unaffected.
				</p>

				<h4 class="font-semibold text-a">10. Changes to Terms</h4>
				<p>
					Terms may be updated when legally or technically necessary.
				</p>
			</section>
		</div>

		<template #footer>
			<div class="flex justify-end">
				<Button
					label="Close"
					icon="pi pi-times"
					size="small"
					severity="secondary"
					@click="isVisible = false" />
			</div>
		</template>

	</Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";

type LegalDocumentType = "privacy" | "terms";

const isVisible = ref(false);
const activeDocument = ref<LegalDocumentType>("privacy");

function open(document: LegalDocumentType) {
	activeDocument.value = document;
	isVisible.value = true;
}

defineExpose({
	open,
});
</script>

<style scoped>
.legal-switch-btn:deep(.p-button-label) {
	white-space: nowrap;
}
</style>