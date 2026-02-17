'use client'

import { useEffect } from 'react'

/**
 * Loads the API interceptor (baseURL, auth headers, 401 refresh) only on the client
 * after mount. Keeps the interceptor and its heavy deps (axios, @hey_api clients)
 * out of the server bundle so RSC requests stay fast.
 */
export function InitInterceptors() {
  useEffect(() => {
    import('@/utils/inteceptor')
  }, [])
  return null
}
