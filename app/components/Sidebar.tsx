'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Discover', href: '/discover' },
    { name: 'My Library', href: '/my-library' },
    { name: 'Profile', href: '/profile' },
    { name: 'Billing', href: '/billing' },
    { name: 'Support', href: '/support' }
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear any local storage or session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleNavigationClick = (href: string) => {
    closeMobileMenu()
    router.push(href)
  }

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMobileMenu}>
          <div 
            className="absolute top-0 left-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <Link href="/" onClick={closeMobileMenu}>
                  <span
                    className="flex items-center px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#7F7BBA] font-sora text-base font-semibold shadow-sm hover:bg-gray-50 transition"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    Genio
                  </span>
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigationClick(item.href)}
                      className={`
                        w-full text-left group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:text-primary hover:bg-primary/10'
                        }
                      `}
                    >
                      {item.name}
                    </button>
                  )
                })}
                <button
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  className="w-full text-left group flex items-center px-3 py-3 text-sm font-medium rounded-md text-gray-700 hover:text-primary hover:bg-primary/10 mt-2"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:flex-col md:h-full">
        <div className="mb-8 mt-2 flex justify-start px-3">
          <Link href="/">
            <span
              className="flex items-center px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#7F7BBA] font-sora text-base font-semibold shadow-sm hover:bg-gray-50 transition"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Genio
            </span>
          </Link>
        </div>
        <nav className="space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:text-primary hover:bg-primary/10'
                  }
                `}
              >
                {item.name}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-primary hover:bg-primary/10 mt-2"
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  )
} 