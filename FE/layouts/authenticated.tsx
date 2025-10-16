'use client'

import Sidebar from '@/components/Sidebar'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // This will automatically sync users with the backend after authentication
  // Works for both email/password and SSO authentication

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <main style={{ marginLeft: '300px', marginRight: '30px' }}>
        <div className="px-10 py-8">{children}</div>
      </main>
    </div>
  )
}
