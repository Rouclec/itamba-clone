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

/**
 * Split a stored phone number (e.g. "+237675224929", "+1 234 567 8900") into dial code and national number.
 * Uses libphonenumber when possible for correct country detection; falls back to regex for incomplete numbers.
 */
export function parseStoredPhone(phone: string | undefined): {
  dialCode: string;
  national: string;
} {
  const defaultDial = "+237";
  if (!phone?.trim()) return { dialCode: defaultDial, national: "" };
  const full = phone.trim().startsWith("+") ? phone.trim() : `+${phone.replace(/\D/g, "")}`;
  const parsed = parsePhone(full);
  if (parsed?.isValid()) {
    const dialCode = `+${parsed.countryCallingCode}`;
    const national = parsed.nationalNumber;
    return { dialCode, national };
  }
  const match = full.match(/^(\+\d+)(.*)$/);
  if (match)
    return {
      dialCode: match[1],
      national: match[2].replace(/\D/g, ""),
    };
  return { dialCode: defaultDial, national: phone.replace(/\D/g, "") };
}
