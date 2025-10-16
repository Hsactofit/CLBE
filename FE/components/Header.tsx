'use client'

import { useAuth, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Header() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()

  const handleSignOut = () => {
    // Sign out and redirect to home page
    router.push('/')
  }

  // Don't render header if user is not signed in
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-primary sticky top-0 z-50">
      <div className="mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Crossing Legal AI Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">User {userId}</span>
            </div>
            <SignOutButton signOutCallback={handleSignOut}>
              <button className="bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  )
}
