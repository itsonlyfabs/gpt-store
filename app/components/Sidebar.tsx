'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    { name: 'Discover', href: '/discover' },
    { name: 'My Library', href: '/my-library' },
    { name: 'Profile', href: '/profile' },
    { name: 'Billing', href: '/billing' },
    { name: 'Support', href: '/support' }
  ]

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt')
      // Add any other logout logic here (e.g., clearing cookies)
      router.push('/')
    }
  }

  return (
    <div className="flex flex-col h-full">
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
  )
} 