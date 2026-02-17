'use client'

import { useEffect } from 'react'

/**
 * Loads the API interceptor (baseURL, auth headers, 401 refresh) only on the client
 * after mount. Keeps the interceptor and its heavy deps (axios, @hey_api clients)
 * out of the server bundle so RSC requests stay fast. Never blocks render; failures
 * are caught so navigation and the app keep working.
 */
export function InitInterceptors() {
  useEffect(() => {
    import('@/utils/inteceptor').catch(() => {
      // Interceptor failed to load (e.g. chunk error, offline). App still works;
      // API calls will fail until reload. Don't throw so we don't break the tree.
    })
  }, [])
  return null
}
