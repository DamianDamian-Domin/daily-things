export function formatDate(date: Date): string[] {
    const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        weekday: "long",
    };
    return date
        .toLocaleDateString("en-GB", options)
        .replace(/,/g, "")
        .split(" ");
}

export function toDateKey(date: Date) : string {
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Miesiące są indeksowane od 0
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
