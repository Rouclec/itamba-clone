import i18next from './i18next'
import { headerName } from './settings'
import { headers } from 'next/headers'

export async function getT(ns: string | string[] = 'translation', options?: { keyPrefix?: string }) {
  const headerList = await headers()
  const locale = headerList.get(headerName)

  if (locale && i18next.resolvedLanguage !== locale) {
    await i18next.changeLanguage(locale)
  }

  const namespace = Array.isArray(ns) ? ns[0] : ns
  if (namespace && !i18next.hasLoadedNamespace(namespace)) {
    await i18next.loadNamespaces(namespace)
  }

  return {
    t: i18next.getFixedT(
      locale ?? i18next.resolvedLanguage ?? 'en',
      namespace,
      options?.keyPrefix
    ),
    i18n: i18next,
  }
}
