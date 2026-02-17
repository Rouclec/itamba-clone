import i18next from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { fallbackLocale, locales, defaultNS } from './settings'

const runsOnServer = typeof window === 'undefined'

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
    preload: runsOnServer ? [...locales] : [],
    interpolation: { escapeValue: false },
  })

export default i18next
