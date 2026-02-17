import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type PhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Build full international number from dial code (e.g. "+237") and national digits.
 */
export function toFullNumber(dialCode: string, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  const code = dialCode.replace(/\D/g, "");
  if (!code || !digits) return "";
  return `+${code}${digits}`;
}

/**
 * Parse a full number (e.g. "+237675224929"). Returns undefined if invalid.
 */
export function parsePhone(fullNumber: string): PhoneNumber | undefined {
  if (!fullNumber || !fullNumber.replace(/\D/g, "").length) return undefined;
  return parsePhoneNumberFromString(fullNumber);
}

/**
 * Validate a full international number (dial code + national digits).
 */
export function isValidPhone(fullNumber: string): boolean {
  if (!fullNumber || fullNumber.replace(/\D/g, "").length < 8) return false;
  return isValidPhoneNumber(fullNumber);
}

/**
 * Validate with optional country hint (e.g. when number is entered without +prefix).
 */
export function isValidPhoneWithCountry(
  number: string,
  defaultCountry?: CountryCode
): boolean {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length < 8) return false;
  const withPlus = number.startsWith("+") ? number : `+${cleaned}`;
  return isValidPhoneNumber(withPlus, defaultCountry);
}

/**
 * Format parsed number to E.164 (e.g. +237675224929).
 */
export function toE164(phone: PhoneNumber): string {
  return phone.format("E.164");
}

/**
 * Format for display (national format, e.g. "6 75 22 49 29" for CM).
 */
export function formatNational(phone: PhoneNumber): string {
  return phone.formatNational();
}

/**
 * Parse, validate, and return E.164. Returns null if invalid.
 */
export function normalizePhone(dialCode: string, nationalDigits: string): string | null {
  const full = toFullNumber(dialCode, nationalDigits);
  const parsed = parsePhone(full);
  if (!parsed || !parsed.isValid()) return null;
  return toE164(parsed);
}
