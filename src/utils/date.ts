import { format, parseISO, isValid } from "date-fns";

/**
 * Converts a date string or object into a structured format with day, month, date, and year.
 * @param date - The date to structure (string, Date, null, or undefined)
 */
export const getStructuredDate = (date: string | Date | null | undefined) => {
  if (!date) return { day: "", month: "", date: "", year: "", full: "" };

  let dateObj: Date;
  if (typeof date === "string") {
    // Try parsing as ISO
    dateObj = parseISO(date);
    // If not valid ISO, try standard Date constructor
    if (!isValid(dateObj)) {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (!isValid(dateObj))
    return { day: "", month: "", date: "", year: "", full: "" };

  return {
    day: format(dateObj, "EEEE"),
    month: format(dateObj, "MMMM"),
    date: format(dateObj, "do"),
    year: format(dateObj, "yyyy"),
    full: format(dateObj, "PPP"), // e.g., April 29th, 2023
    simple: format(dateObj, "dd/MM/yyyy"),
  };
};

/**
 * Formats a date for display in the UI.
 */
export const formatDateForDisplay = (
  date: string | Date | null | undefined,
) => {
  if (!date) return "";
  const structured = getStructuredDate(date);
  return structured.full || "";
};

/**
 * Formats a date specifically for input fields (DD/MM/YYYY).
 */
export const formatDateForInput = (date: string | Date | null | undefined) => {
  if (!date) return "";
  const structured = getStructuredDate(date);
  return structured.simple || "";
};
