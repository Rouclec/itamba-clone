/**
 * Format a numeric amount (e.g. from API as string) for display.
 * Uses locale-aware grouping (e.g. 10000 -> "10,000" in en).
 */
export function formatAmount(
  value: string | number | undefined | null,
  locale = "en"
): string {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
