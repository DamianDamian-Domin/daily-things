import { defineMessages } from "@/i18n";

// Polityka prywatności, regulamin i baner zgody na cookies
export const legalMessages = defineMessages(
	{
		privacyPolicy: "Privacy Policy",
		termsOfService: "Terms of Service",
		documentLabel: "Document",
		close: "Close",
		privacy: {
			intro:
				"This Privacy Policy explains the minimum necessary rules for personal data processing in Daily Things. It is prepared for a private individual publisher and aligned with GDPR and Polish data protection requirements.",
			sections: [
				{
					heading: "1. Data Controller",
					paragraphs: [
						"Controller: Damian Domin, private individual, based in Krakow, Poland. Contact: damian.domin334@gmail.com.",
					],
				},
				{
					heading: "2. Categories of Data",
					paragraphs: [
						"We process only data needed to provide the app: email/login identifier, optional display name/photo, and user content (habits, to-dos, goals, preferences).",
					],
				},
				{
					heading: "3. Purposes and Legal Bases (GDPR Art. 6)",
					paragraphs: [
						"To provide your account and app functions: Art. 6(1)(b) GDPR (contract).",
						"For security and abuse prevention: Art. 6(1)(f) GDPR (legitimate interest).",
						"Analytics and optional cookies: Art. 6(1)(a) GDPR (consent).",
					],
				},
				{
					heading: "4. Cookies and Similar Technologies",
					paragraphs: [
						"Essential storage/cookies are used for login and app settings. Optional analytics is off by default and can be enabled/disabled in Settings at any time.",
					],
				},
				{
					heading: "5. Data Recipients",
					paragraphs: [
						"Data is processed using service providers necessary to run the app (e.g., Firebase/Google Cloud for authentication and database) under appropriate data processing terms.",
					],
				},
				{
					heading: "6. International Data Transfers",
					paragraphs: [
						"If data is transferred outside the EEA, GDPR safeguards are used (e.g., Standard Contractual Clauses).",
					],
				},
				{
					heading: "7. Retention Periods",
					paragraphs: [
						"Data is stored while your account is active and removed after deletion request, unless longer storage is required by law.",
					],
				},
				{
					heading: "8. Data Subject Rights",
					paragraphs: [
						"You can request access, rectification, erasure, restriction, portability, object to legitimate-interest processing, and withdraw consent.",
						"You can lodge a complaint with UODO (Poland): President of the Personal Data Protection Office, ul. Stawki 2, 00-193 Warsaw.",
					],
				},
				{
					heading: "9. Children",
					paragraphs: [
						"The app is not intended for children under the minimum age required by applicable law without parental consent.",
					],
				},
				{
					heading: "10. Policy Changes",
					paragraphs: ["This policy may be updated if required by law or service changes."],
				},
			],
		},
		terms: {
			intro:
				"These Terms define the basic rules of using Daily Things. They are kept intentionally short and include the minimum information required for an online service provided by a private individual.",
			sections: [
				{
					heading: "1. Service Provider",
					paragraphs: [
						"Provider: Damian Domin, private individual, based in Krakow, Poland. Contact: damian.domin334@gmail.com.",
					],
				},
				{
					heading: "2. Scope of Service",
					paragraphs: [
						"Daily Things lets users manage habits, to-dos and goals through an account-based app.",
					],
				},
				{
					heading: "3. Technical Requirements",
					paragraphs: [
						"A supported mobile device/browser, internet access and an email/login method are required.",
					],
				},
				{
					heading: "4. User Responsibilities",
					paragraphs: [
						"Users must keep their login credentials safe and use the app lawfully. Abuse, unauthorized access attempts and harmful content are prohibited.",
					],
				},
				{
					heading: "5. Fees",
					paragraphs: [
						"Current version: free of charge. If paid plans are introduced, pricing and billing terms will be published before purchase.",
					],
				},
				{
					heading: "6. Complaints and Contact",
					paragraphs: [
						"Complaints and support requests can be sent to damian.domin334@gmail.com. A response is provided without undue delay, usually within 14 days.",
					],
				},
				{
					heading: "7. Account Deletion",
					paragraphs: ["Users can stop using the app anytime and request account/data deletion."],
				},
				{
					heading: "8. Liability",
					paragraphs: [
						"The service is provided with due care. Nothing in these Terms limits mandatory consumer rights under applicable law.",
					],
				},
				{
					heading: "9. Governing Law",
					paragraphs: [
						"Polish law applies, with mandatory consumer protections under EU law remaining unaffected.",
					],
				},
				{
					heading: "10. Changes to Terms",
					paragraphs: ["Terms may be updated when legally or technically necessary."],
				},
			],
		},
		// Baner cookies
		consent: {
			title: "A quick note on privacy 🍪",
			desc: "We only store what's needed to keep you signed in and save your progress. With your OK, we may also measure anonymous usage to make Daily Things better.",
			essential: "Essential",
			essentialDesc: "Sign-in and saving your data. Always on.",
			alwaysOn: "Always on",
			analytics: "Anonymous analytics",
			analyticsDesc: "Helps us see what to improve.",
			hideOptions: "Hide options",
			options: "Options",
			saveChoice: "Save choice",
			essentialOnly: "Essential only",
			acceptAll: "Accept all",
		},
	},
	{
		privacyPolicy: "Polityka prywatności",
		termsOfService: "Regulamin",
		documentLabel: "Dokument",
		close: "Zamknij",
		privacy: {
			intro:
				"Niniejsza Polityka prywatności opisuje minimalne niezbędne zasady przetwarzania danych osobowych w Daily Things. Została przygotowana dla wydawcy będącego osobą prywatną i jest zgodna z RODO oraz polskimi przepisami o ochronie danych osobowych.",
			sections: [
				{
					heading: "1. Administrator danych",
					paragraphs: [
						"Administrator: Damian Domin, osoba prywatna z siedzibą w Krakowie (Polska). Kontakt: damian.domin334@gmail.com.",
					],
				},
				{
					heading: "2. Kategorie danych",
					paragraphs: [
						"Przetwarzamy wyłącznie dane potrzebne do działania aplikacji: adres e-mail/identyfikator logowania, opcjonalną nazwę wyświetlaną/zdjęcie oraz treści użytkownika (habity, zadania, cele, preferencje).",
					],
				},
				{
					heading: "3. Cele i podstawy prawne (art. 6 RODO)",
					paragraphs: [
						"Prowadzenie konta i udostępnianie funkcji aplikacji: art. 6 ust. 1 lit. b RODO (umowa).",
						"Bezpieczeństwo i zapobieganie nadużyciom: art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes).",
						"Analityka i opcjonalne pliki cookies: art. 6 ust. 1 lit. a RODO (zgoda).",
					],
				},
				{
					heading: "4. Pliki cookies i podobne technologie",
					paragraphs: [
						"Niezbędna pamięć lokalna/pliki cookies służą do logowania i zapisu ustawień aplikacji. Opcjonalna analityka jest domyślnie wyłączona i w każdej chwili można ją włączyć lub wyłączyć w Ustawieniach.",
					],
				},
				{
					heading: "5. Odbiorcy danych",
					paragraphs: [
						"Dane są przetwarzane z udziałem dostawców usług niezbędnych do działania aplikacji (np. Firebase/Google Cloud — uwierzytelnianie i baza danych) na podstawie odpowiednich umów powierzenia przetwarzania danych.",
					],
				},
				{
					heading: "6. Przekazywanie danych poza EOG",
					paragraphs: [
						"Jeśli dane są przekazywane poza Europejski Obszar Gospodarczy, stosowane są zabezpieczenia przewidziane w RODO (np. standardowe klauzule umowne).",
					],
				},
				{
					heading: "7. Okres przechowywania",
					paragraphs: [
						"Dane są przechowywane, dopóki konto jest aktywne, i usuwane po zgłoszeniu żądania usunięcia, chyba że dłuższe przechowywanie wymagane jest przez prawo.",
					],
				},
				{
					heading: "8. Prawa osób, których dane dotyczą",
					paragraphs: [
						"Masz prawo żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i przeniesienia, wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie oraz wycofać zgodę.",
						"Masz prawo wnieść skargę do organu nadzorczego: Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa.",
					],
				},
				{
					heading: "9. Dzieci",
					paragraphs: [
						"Aplikacja nie jest przeznaczona dla dzieci poniżej minimalnego wieku wymaganego przez obowiązujące prawo bez zgody rodzica lub opiekuna.",
					],
				},
				{
					heading: "10. Zmiany polityki",
					paragraphs: [
						"Polityka może zostać zaktualizowana, jeśli będzie to wymagane przez prawo lub zmiany w usłudze.",
					],
				},
			],
		},
		terms: {
			intro:
				"Niniejszy Regulamin określa podstawowe zasady korzystania z Daily Things. Jest celowo krótki i zawiera minimum informacji wymaganych dla usługi świadczonej online przez osobę prywatną.",
			sections: [
				{
					heading: "1. Usługodawca",
					paragraphs: [
						"Usługodawca: Damian Domin, osoba prywatna z siedzibą w Krakowie (Polska). Kontakt: damian.domin334@gmail.com.",
					],
				},
				{
					heading: "2. Zakres usługi",
					paragraphs: [
						"Daily Things umożliwia zarządzanie habitami, zadaniami i celami w aplikacji opartej na koncie użytkownika.",
					],
				},
				{
					heading: "3. Wymagania techniczne",
					paragraphs: [
						"Wymagane są: obsługiwane urządzenie mobilne/przeglądarka, dostęp do internetu oraz adres e-mail lub inna metoda logowania.",
					],
				},
				{
					heading: "4. Obowiązki użytkownika",
					paragraphs: [
						"Użytkownik musi chronić swoje dane logowania i korzystać z aplikacji zgodnie z prawem. Zabronione są nadużycia, próby nieuprawnionego dostępu oraz treści szkodliwe.",
					],
				},
				{
					heading: "5. Opłaty",
					paragraphs: [
						"Obecna wersja jest bezpłatna. Jeśli zostaną wprowadzone płatne plany, cennik i warunki rozliczeń zostaną opublikowane przed zakupem.",
					],
				},
				{
					heading: "6. Reklamacje i kontakt",
					paragraphs: [
						"Reklamacje i prośby o pomoc można wysyłać na adres damian.domin334@gmail.com. Odpowiedź udzielana jest bez zbędnej zwłoki, zwykle w ciągu 14 dni.",
					],
				},
				{
					heading: "7. Usunięcie konta",
					paragraphs: [
						"Użytkownik może w każdej chwili zaprzestać korzystania z aplikacji i zażądać usunięcia konta oraz danych.",
					],
				},
				{
					heading: "8. Odpowiedzialność",
					paragraphs: [
						"Usługa świadczona jest z należytą starannością. Żadne postanowienie Regulaminu nie ogranicza bezwzględnie obowiązujących praw konsumenta wynikających z obowiązującego prawa.",
					],
				},
				{
					heading: "9. Prawo właściwe",
					paragraphs: [
						"Zastosowanie ma prawo polskie, bez uszczerbku dla bezwzględnie obowiązujących przepisów prawa UE chroniących konsumentów.",
					],
				},
				{
					heading: "10. Zmiany Regulaminu",
					paragraphs: [
						"Regulamin może być aktualizowany, gdy będzie to konieczne ze względów prawnych lub technicznych.",
					],
				},
			],
		},
		consent: {
			title: "Krótko o prywatności 🍪",
			desc: "Zapisujemy tylko to, co potrzebne, żeby utrzymać cię zalogowanym i zachować twoje postępy. Za twoją zgodą możemy też mierzyć anonimowe użycie, żeby ulepszać Daily Things.",
			essential: "Niezbędne",
			essentialDesc: "Logowanie i zapis twoich danych. Zawsze włączone.",
			alwaysOn: "Zawsze włączone",
			analytics: "Anonimowa analityka",
			analyticsDesc: "Pomaga nam zobaczyć, co ulepszyć.",
			hideOptions: "Ukryj opcje",
			options: "Opcje",
			saveChoice: "Zapisz wybór",
			essentialOnly: "Tylko niezbędne",
			acceptAll: "Akceptuj wszystkie",
		},
	},
);
