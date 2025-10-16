import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { API_ENDPOINTS } from './lib/api'
import { shouldRedirectToLanding } from './lib/legacyRedirects'

const publicRoutes = [
  '/',
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.CLIENT_SIGNUP,
  API_ENDPOINTS.CLIENT_REGISTRATION,
  API_ENDPOINTS.SSO_CALLBACK,
  API_ENDPOINTS.PRIVACY_POLICY,
  API_ENDPOINTS.TERMS_OF_USE,
  API_ENDPOINTS.TEST,
]

export default authMiddleware({
  signInUrl: '/login',

  // Force redirect to /login (never use hosted Clerk page)
  afterAuth(auth, req) {
    const { userId } = auth
    const { pathname, search } = req.nextUrl

    // Redirect any legacy paths to landing page
    if (shouldRedirectToLanding(pathname)) {
      const url = new URL('/', req.url)
      return NextResponse.redirect(url)
    }
    const isPublic = publicRoutes.includes(pathname)

    if (!userId && !isPublic) {
      const url = new URL('/login', req.url)
      if (pathname) {
        url.searchParams.set('redirect_url', pathname + search)
      }

      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  },

  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ['/api/webhook'],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
