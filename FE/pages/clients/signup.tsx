/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react'
import { useSignUp, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/router'
import UnauthenticatedLayout from '@/layouts/unauthenticated'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import Image from 'next/image'

export default function SignupPage() {
  const { signUp, isLoaded } = useSignUp()
  const { setActive, signOut } = useClerk()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthFetch()

  // One-time sign-out on first arrival to ensure no stale Clerk cookies interfere
  const [didClearSession, setDidClearSession] = useState(false)

  useEffect(() => {
    if (didClearSession) return
    const clearedParam = (router.query.cleared as string) === '1'
    ;(async () => {
      try {
        if (!clearedParam) {
          await signOut()
          await router.replace(`${router.pathname}?cleared=true`)
          return
        }
      } catch {
        console.error('Error clearing stale Clerk session on signup')
      } finally {
        setDidClearSession(true)
      }
    })()
  }, [didClearSession, router, signOut])

  // Debug: Log when component renders
  // Force logout function to clear stuck auth state (manual trigger only)
  const forceLogout = async () => {
    try {
      // Try to sign out from Clerk first
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
      // If Clerk signOut fails, continue with manual cleanup
    }

    // Clear all browser storage
    localStorage.clear()
    sessionStorage.clear()

    // Clear all cookies
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })

    // Reload the page to get a clean state
    window.location.reload()
  }

  // POST client info to backend after sign up
  const postClientToBackend = async (clerkUserId: string) => {
    const clientInfo = localStorage.getItem('clientRegistration')

    if (clientInfo) {
      try {
        const parsed = JSON.parse(clientInfo)
        const requestBody = {
          clerkUserId: clerkUserId,
          userEmail: email, // email entered during signup
          clientName: parsed.clientName,
          tradeName: parsed.tradeName,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          address: parsed.address,
          address2: parsed.address2,
          city: parsed.city,
          state: parsed.state,
          zip: parsed.zip,
          telephone: parsed.telephone,
          naicsCode: parsed.naicsCode,
          fein: parsed.fein,
        }

        // Use useAuthFetch since we now have a Clerk user ID
        const response = await authFetch('/clients', {
          method: 'POST',
          body: requestBody,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Backend error details:', errorText)
        } else {
          localStorage.removeItem('clientRegistration')
        }
      } catch (err) {
        console.error('Failed to POST client info to backend:', err)
      }
    } else {
      console.log('No client registration info found in localStorage')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !isLoaded) return
    setIsSigningUp(true)
    setError(null)
    try {
      signUp
        .create({
          emailAddress: email,
          password,
        })
        .then(async () => {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
          setShowCodeInput(true)
        })
        .catch(error => {
          const errorStr = JSON.stringify(error)
          const errorJSON = JSON.parse(errorStr)

          if (errorJSON.status === 422) {
            // Extract error details from the response (Clerk's error object might have specific properties)
            const errorMessage = errorJSON.errors[0]?.longMessage || 'Invalid input provided.'
            // Display errorMessage to the user
            setError(errorMessage || 'Failed to create account. Please try again.')
            return
          }

          setError('Failed to create account. Please try again.')
        })
        .finally(() => {
          setIsSigningUp(false)
        })
    } catch (err) {
      console.log('Outer catch: ', err)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !isLoaded) return
    setIsSigningUp(true)
    setError(null)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        const clerkUserId = result.createdUserId
        // Activate the session to ensure user is properly authenticated
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
        }
        if (clerkUserId) {
          // Create client if registration data exists (same as SSO workflow)
          await postClientToBackend(clerkUserId)

          // Redirect after client is created
          router.push('/projects')
        } else {
          console.error('No Clerk user ID found in result:', result)
          setError('User creation failed. Please try again.')
        }
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setIsSigningUp(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return
    setIsSigningUp(true)
    setError(null)
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/sso-callback',
      })
    } catch {
      setError('Google sign up failed. Please try again.')
    } finally {
      setIsSigningUp(false)
    }
  }

  return (
    <UnauthenticatedLayout>
      {/* <ErrorBoundary message="Testing"> */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 mb-4 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Crossing Legal AI"
                  className="object-contain"
                  width={240}
                  height={80}
                />
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
            </div>
            {!showCodeInput ? (
              <form className="space-y-4" onSubmit={handleEmailSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                    placeholder="Create a password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSigningUp || !email || !password}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ marginTop: 32 }}
                >
                  {isSigningUp ? 'Creating account...' : 'Sign Up'}
                </button>

                {/* Force logout button for stuck auth state */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={forceLogout}
                    className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Having trouble? Clear session and try again
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleCodeSubmit}>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-center text-lg tracking-widest font-mono text-sm"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    We&apos;ve sent a 6-digit code to {email}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(false)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ← Back to email
                  </button>
                  <button
                    type="submit"
                    disabled={isSigningUp || !code}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSigningUp ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>

                {/* Force logout button for stuck auth state */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={forceLogout}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Having trouble? Clear session and try again
                  </button>
                </div>
              </form>
            )}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-400 w-4 h-4"></i>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Google Sign Up Button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleGoogleSignUp}
                  disabled={isSigningUp}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
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
                  <span className="ml-2">Sign up with Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* </ErrorBoundary> */}
    </UnauthenticatedLayout>
  )
}
