'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Image from 'next/image'

interface SidebarProps {
  collapsed?: boolean
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { isSignedIn, signOut } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // AUTH DISABLED FOR DEVELOPMENT
  // if (!isSignedIn) {
  //   return null
  // }

  const handleLogout = () => {
    signOut()
  }

  const menuItems = [
    { label: 'Employer Dashboard', icon: 'fas fa-th-large', href: '/projects' },
    { label: 'Company Setup', icon: 'fas fa-building', href: '/company-setup' },
    { label: 'My Applications', icon: 'fas fa-file-alt', href: '/projects' },
    { label: 'Notifications', icon: 'fas fa-bell', href: '/notifications' },
    { label: 'Team', icon: 'fas fa-users', href: '/team' },
    { label: 'Settings', icon: 'fas fa-cog', href: '/settings' },
    { label: 'Logout', icon: 'fas fa-sign-out-alt', action: handleLogout },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-gray-900 text-white rounded-lg"
        >
          <i className={`fas ${isMobileOpen ? 'fa-times' : 'fa-bars'} w-5 h-5`}></i>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center justify-center">
            {!collapsed && (
              <Image
                src="/logo-white.png"
                alt="Logo"
                width={120}
                height={40}
                className="w-auto h-9"
              />
            )}
            {collapsed && (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-sm">C</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-4">
          <ul>
            {menuItems.map(item => (
              <li key={item.label}>
                {item.action ? (
                  <button
                    onClick={item.action}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors`}
                    title={collapsed ? item.label : undefined}
                  >
                    <i className={`${item.icon} w-5 h-5 py-0.5`}></i>
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors`}
                    title={collapsed ? item.label : undefined}
                  >
                    <i className={`${item.icon} w-5 h-5 py-0.5`}></i>
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
