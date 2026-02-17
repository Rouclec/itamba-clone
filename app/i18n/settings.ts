export const fallbackLocale = 'en'
export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]
export const defaultNS = 'translation'
export const cookieName = 'i18next-locale'
export const headerName = 'x-i18next-locale'
