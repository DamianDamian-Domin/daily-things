export function formatDate(date) {
    const options = {
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

export function toDateKey(date) {
    return date.toISOString().split("T")[0];
}