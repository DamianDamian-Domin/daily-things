// Notatka przy odhaczeniu habitu (np. „wymieniony filtr, model X”).
// Krótka, jednowierszowa — mieści się w liście historii.
export const NOTE_MAX_LENGTH = 200;

// Przycinamy spacje, sklejamy białe znaki (także entery) i obcinamy długość.
// Pusta notatka = brak notatki.
export function cleanNote(input: string | null | undefined): string {
	return (input ?? "").replace(/\s+/g, " ").trim().slice(0, NOTE_MAX_LENGTH).trim();
}
