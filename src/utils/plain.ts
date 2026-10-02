// Głęboka kopia bez reaktywnych proxy Vue — bezpieczna do zapisu w Firestore.
// (structuredClone rzuca DataCloneError, gdy w środku jest Proxy.)
// Nasze dane są czystym JSON-em: stringi, liczby, tablice, obiekty.
export function plain<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
