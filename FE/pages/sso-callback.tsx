'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import LoadingSpinner from '@/components/LoadingSpinner'
import UnauthenticatedLayout from '@/layouts/unauthenticated'
import { API_ENDPOINTS } from '@/lib/api'

export default function SSOCallbackPage() {
  const { isLoaded, getToken, userId } = useAuth()
  const { user } = useUser()
  const authFetch = useAuthFetch()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'creating' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    ;(async () => {
      try {
        const token = await getToken({ skipCache: true })
        if (!token) {
          setStatus('error')
          setError('No active session. Please sign in again.')
          return
        }

        // Build client creation payload
        const registration = localStorage.getItem('clientRegistration')
        let payload: Record<string, unknown> = {
          clerkUserId: userId,
          userEmail:
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            undefined,
        }
        if (registration) {
          try {
            const parsed = JSON.parse(registration)
            payload = {
              ...payload,
              clientName: parsed.clientName,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              address: parsed.address,
              city: parsed.city,
              state: parsed.state,
              zip: parsed.zip,
            }
          } catch {
            // ignore parse failure; proceed with minimal payload
          }
        }

        // Post client to backend (idempotent on backend side)
        setStatus('creating')
        const resp = await authFetch('/clients', {
          method: 'POST',
          body: payload,
        })

        if (!resp.ok) {
          const errText = await resp.text()
          setStatus('error')
          setError(errText || 'Failed to create client during SSO.')
          return
        }

        // Cleanup and redirect
        localStorage.removeItem('clientRegistration')
        setStatus('success')
        router.replace(API_ENDPOINTS.PROJECTS)
      } catch (e) {
        setStatus('error')
        setError(`Something went wrong completing SSO. ${e}`)
      }
    })()
  }, [isLoaded, getToken, authFetch, router, user, userId])

  if (!isLoaded || status === 'loading') {
    return (
      <UnauthenticatedLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 text-lg">Setting up your account...</p>
          </div>
        </div>
      </UnauthenticatedLayout>
    )
  }

  if (status === 'creating') {
    return (
      <UnauthenticatedLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 text-lg">Creating your account...</p>
          </div>
        </div>
      </UnauthenticatedLayout>
    )
  }

  if (status === 'error') {
    return (
      <UnauthenticatedLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-medium text-lg">Account setup failed</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </UnauthenticatedLayout>
    )
  }

  if (status === 'success') {
    return (
      <UnauthenticatedLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-medium text-lg">Account setup successful!</p>
              <p className="text-sm mt-2">Redirecting to your dashboard...</p>
            </div>
            <LoadingSpinner />
          </div>
        </div>
      </UnauthenticatedLayout>
    )
  }

  return null
}
