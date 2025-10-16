/* A simple and generic fetch with authentication */
import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Allow plain-object bodies in calls; we'll JSON-encode them here
type ApiRequestInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown
  headers?: HeadersInit | Record<string, string>
}

export function useAuthFetch() {
  const { getToken, userId } = useAuth()

  /**
   * @param path relative path, e.g. "/users/me"
   * @param options any native fetch options, keep consistent
   */

  return useCallback(
    async function authFetch(path: string, options: ApiRequestInit = {}): Promise<Response> {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
      }

      // Attach auth token
      const token = await getToken({ skipCache: true })
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Auto-JSON encode plain object bodies (but leave FormData/Blob/etc untouched)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body = options.body as any
      const isPlainObjectBody = body && typeof body === 'object' && !(body instanceof FormData)
      if (isPlainObjectBody) {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }
        body = JSON.stringify(body)
      }

      return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        body,
      })
    },
    [getToken]
  )
}
