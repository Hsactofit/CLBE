'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, SignOutButton, useSignIn } from '@clerk/nextjs'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  UserPublic,
  ApiResponse,
  ProjectsPublic,
  ProjectPublic,
  FormsPublic,
  SectionsPublic,
  SectionFieldsPublic,
} from '@/types/api'

export default function Test() {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const { isSignedIn, isLoaded } = useAuth()
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const [response, setResponse] = useState<ApiResponse<
    | UserPublic
    | ProjectsPublic
    | ProjectPublic
    | FormsPublic
    | SectionsPublic
    | SectionFieldsPublic
    | { message: string }
  > | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login')
    }
  }, [isLoaded, isSignedIn, router])

  const handleGetUserInfo = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await authFetch('/users/me')

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to get user info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return

    setIsSigningIn(true)
    setError(null)

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/sso-callback',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(errorMessage)
      console.error('Google sign-in error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleEmailSignIn = async () => {
    if (!signInLoaded || !email) return

    setIsSigningIn(true)
    setError(null)

    try {
      await signIn.create({
        identifier: email,
        strategy: 'email_code',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Email sign-in failed'
      setError(errorMessage)
      console.error('Email sign-in error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">API Testing Page</h1>
            <p className="text-gray-600 mb-8 text-center">
              This page is for testing the backend API endpoints. Please sign in to continue.
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleEmailSignIn}
                  disabled={isSigningIn || !email}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isSigningIn ? 'Sending code...' : 'Send sign-in code'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">API Testing Page</h1>
            <SignOutButton>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test API Endpoints</h2>
              <div className="space-y-4">
                <button
                  onClick={handleGetUserInfo}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Loading...' : 'Get User Info'}
                </button>
              </div>
            </div>

            {error && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {response && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Response</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
