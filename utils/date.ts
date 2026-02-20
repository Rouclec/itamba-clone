import moment from "moment";
import "moment/locale/fr";

/**
 * Normalizes backend date strings so they parse reliably on all platforms (including iOS Safari).
 * Converts e.g. "2024-01-15 12:00:00 +0000 UTC" to "2024-01-15T12:00:00Z" (ISO 8601).
 */
export function normalizeDateString(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(" +0000 UTC", "Z").replace(" ", "T");
}

/**
 * Format a document date for display. Uses the given locale for month names etc. (e.g. "en" → "Oct 05, 2023", "fr" → "5 oct. 2023").
 * @param issued - Raw date string from the API (will be normalized for iOS etc.)
 * @param locale - User's current locale, e.g. from useLocale() ("en" | "fr"). Omit to use moment's default (English).
 */
export function formatDocumentDate(
  issued: string | null | undefined,
  locale?: string,
): string {
  const normalized = normalizeDateString(issued);
  if (!normalized) return "";
  const m = moment(normalized);
  if (!m.isValid()) return "";
  if (locale) m.locale(locale.startsWith("fr") ? "fr" : "en");
  return m.format("MMM DD, YYYY");
}

/**
 * Format a bookmark/list date-time for display (e.g. "Jan 2, 2026 12:00 PM").
 */
export function formatBookmarkDateTime(
  dateStr: string | null | undefined,
  locale?: string,
): string {
  const normalized = normalizeDateString(dateStr);
  if (!normalized) return "";
  const m = moment(normalized);
  if (!m.isValid()) return "";
  if (locale) m.locale(locale.startsWith("fr") ? "fr" : "en");
  return m.format("MMM D, YYYY h:mmA");
}
