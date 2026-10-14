import { ref, watch } from "vue";

// ==========================================================================
// Lekka infrastruktura tłumaczeń (bez zależności).
//
// Każdy obszar aplikacji ma własny plik w src/i18n/messages/ z dwoma
// słownikami: `en` (źródło prawdy dla typów) i `pl`. TypeScript pilnuje,
// żeby `pl` miał dokładnie te same klucze — brakujące tłumaczenie to błąd
// typecheck. Nowa funkcja = nowy plik w messages/, bez dotykania innych.
//
//   export const fooMessages = defineMessages(
//     { title: "Hello", count: (n: number) => `${n} ${enPlural(n, "item", "items")}` },
//     { title: "Cześć", count: (n) => `${n} ${plPlural(n, "rzecz", "rzeczy", "rzeczy")}` },
//   );
//
//   // w komponencie:  const m = fooMessages;   {{ m.title }}  {{ m.count(3) }}
//
// Odczyt `m.title` czyta reaktywny `locale`, więc szablony i computed
// przeliczają się same po zmianie języka.
// ==========================================================================

export type Locale = "en" | "pl";
export const LOCALES: Locale[] = ["en", "pl"];

const STORAGE_KEY = "language";

function readStored(): Locale | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw === "en" || raw === "pl" ? raw : null;
	} catch {
		return null;
	}
}

// Domyślnie wg języka przeglądarki/telefonu: polski dla „pl*”, inaczej angielski
export function detectLocale(languages: readonly string[] | undefined = navigatorLanguages()): Locale {
	for (const lang of languages ?? []) {
		const base = lang.toLowerCase().split("-")[0];
		if (base === "pl") return "pl";
		if (base === "en") return "en";
	}
	return "en";
}

function navigatorLanguages(): readonly string[] {
	if (typeof navigator === "undefined") return [];
	return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export const locale = ref<Locale>(readStored() ?? detectLocale());

// Czy użytkownik sam wybrał język (wtedy nie nadpisujemy go wykrywaniem)
export const localeChosen = ref(readStored() !== null);

export function setLocale(next: Locale, { remember = true } = {}) {
	locale.value = next;
	if (!remember) return;
	localeChosen.value = true;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		/* tryb prywatny — ignorujemy */
	}
}

function applyDocumentLang(l: Locale) {
	if (typeof document !== "undefined") document.documentElement.lang = l;
}
applyDocumentLang(locale.value);
watch(locale, applyDocumentLang);

// Locale dla Intl / toLocaleDateString
export function dateLocale(l: Locale = locale.value): string {
	return l === "pl" ? "pl-PL" : "en-GB";
}

// --------------------------------------------------------------------------
// Odmiana przez liczby
// --------------------------------------------------------------------------
export function enPlural(n: number, one: string, other: string): string {
	return Math.abs(n) === 1 ? one : other;
}

// Polski: 1 dzień, 2–4 dni, 5–21 dni, 22–24 dni… (one / few / many)
export function plPlural(n: number, one: string, few: string, many: string): string {
	const abs = Math.abs(n);
	if (!Number.isInteger(abs)) return few; // ułamki: „1,5 godziny”
	if (abs === 1) return one;
	const mod10 = abs % 10;
	const mod100 = abs % 100;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}

// --------------------------------------------------------------------------
// Słowniki
// --------------------------------------------------------------------------
type Widen<T> = T extends string
	? string
	: T extends (...args: infer A) => infer R
		? (...args: A) => Widen<R>
		: T extends readonly (infer U)[]
			? Widen<U>[]
			: T extends object
				? { [K in keyof T]: Widen<T[K]> }
				: T;

export type Messages<T> = Widen<T>;

const registry: { en: object; pl: object }[] = [];

// Zwraca obiekt-proxy: każdy odczyt klucza bierze wartość z aktualnego języka
export function defineMessages<const T extends object>(en: T, pl: NoInfer<Widen<T>>): Widen<T> {
	const dicts: Record<Locale, object> = { en, pl };
	registry.push({ en, pl });
	return new Proxy({} as Widen<T>, {
		get(_target, key) {
			return (dicts[locale.value] as Record<PropertyKey, unknown>)[key];
		},
		has(_target, key) {
			return key in dicts[locale.value];
		},
		ownKeys() {
			return Reflect.ownKeys(dicts[locale.value]);
		},
		getOwnPropertyDescriptor(_target, key) {
			const value = (dicts[locale.value] as Record<PropertyKey, unknown>)[key];
			return value === undefined
				? undefined
				: { value, enumerable: true, configurable: true, writable: false };
		},
	});
}

// Dla testów: wszystkie zarejestrowane słowniki (sprawdzanie kompletności)
export function registeredDictionaries() {
	return registry;
}

// Pojedynczy tekst zależny od języka (np. etykieta kategorii w stałej tablicy)
export function localized(en: string, pl: string): string {
	return locale.value === "pl" ? pl : en;
}

// Definiuje na obiekcie pole-getter, które zwraca tekst w aktualnym języku.
// Dzięki temu stałe (katalog habitów, kategorie) tłumaczą się „same”,
// a kod czytający `habit.display_name` nie musi nic wiedzieć o i18n.
export function defineLocalizedField<T extends object>(
	target: T,
	field: keyof T & string,
	pl: string | undefined,
) {
	const en = target[field] as unknown as string;
	if (!pl || pl === en) return;
	Object.defineProperty(target, field, {
		get: () => (locale.value === "pl" ? pl : en),
		set: () => {
			/* stałe katalogowe są tylko do odczytu */
		},
		enumerable: true,
		configurable: true,
	});
}
