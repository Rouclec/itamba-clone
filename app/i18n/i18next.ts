import i18next from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { fallbackLocale, locales, defaultNS } from './settings'

const isServer = typeof window === 'undefined'

i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`).then((m) => m.default)
    )
  )
  .init({
    supportedLngs: [...locales],
    fallbackLng: fallbackLocale,
    fallbackNS: defaultNS,
    defaultNS,
    preload: isServer ? [] : [...locales],
    interpolation: { escapeValue: false },
  })

// Server only: load locale JSONs synchronously so getFixedT() returns real strings (no Promise = no AsyncHook overflow)
if (isServer) {
  const enTranslation = require('./locales/en/translation.json') as Record<string, unknown>
  const frTranslation = require('./locales/fr/translation.json') as Record<string, unknown>
  i18next.addResourceBundle('en', 'translation', enTranslation)
  i18next.addResourceBundle('fr', 'translation', frTranslation)
}

export default i18next
