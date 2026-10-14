// Kiedy nową wersję aplikacji (po deployu) włączyć od razu, a kiedy tylko
// zaproponować. Przeładowanie w trakcie pisania zadania byłoby irytujące,
// ale nikt nie powinien zostać na starej wersji dłużej, niż to konieczne.

// Tyle czasu po starcie przeładowanie jest niezauważalne (jeszcze splash
// albo pierwsze malowanie), o ile użytkownik niczego nie kliknął
export const FRESH_START_MS = 6000;

export interface UpdateMoment {
	msSinceStart: number;
	interacted: boolean;
	hidden: boolean;
}

export function shouldApplyUpdateNow({ msSinceStart, interacted, hidden }: UpdateMoment): boolean {
	if (hidden) return true;
	return !interacted && msSinceStart < FRESH_START_MS;
}
