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
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Miesiące są indeksowane od 0
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const convertDateToDbFormat = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`; 
};

export const formatDateToDbFormat = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };