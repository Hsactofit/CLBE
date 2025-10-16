'use client'

import { useEffect, useState } from 'react'

export function useOAuthRedirect() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hasOAuthParams =
      urlParams.has('__clerk_status') ||
      urlParams.has('__clerk_created_session') ||
      urlParams.has('__clerk_synced')

    // Also check sessionStorage for OAuth progress
    const oauthInProgress = sessionStorage.getItem('googleOAuthInProgress')

    if (hasOAuthParams || oauthInProgress) {
      setIsRedirecting(true)

      // Clear the session storage flag
      if (oauthInProgress) {
        sessionStorage.removeItem('googleOAuthInProgress')
      }

      // Clear the URL parameters after a brief delay
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
        setIsRedirecting(false)
      }, 1000) // Increased delay to ensure auth state is fully established
    }
  }, [])

  return { isRedirecting }
}
