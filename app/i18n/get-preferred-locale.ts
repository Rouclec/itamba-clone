'use client';

import { cookieName, locales } from './settings';

/**
 * Reads the user's preferred locale from the i18next cookie (client only).
 * Used on email verification screens where the link is always e.g. /fr;
 * we redirect to the preferred locale if it differs.
 */
export function getPreferredLocaleFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(
      '(^| )' + cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)',
    ),
  );
  const value = match ? match[2].trim() : null;
  return value && locales.includes(value as (typeof locales)[number])
    ? value
    : null;
}
