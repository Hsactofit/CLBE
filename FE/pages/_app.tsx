import type { AppProps } from 'next/app'
import { ClerkProvider } from '@clerk/nextjs'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../styles/globals.css'
import '../styles/sections.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#5488CE', colorBackground: '#5488CE' },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/login"
      signUpUrl="/login"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <Component {...pageProps} />
    </ClerkProvider>
  )
}
