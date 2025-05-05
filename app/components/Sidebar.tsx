'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Discover', href: '/discover' },
    { name: 'My Library', href: '/my-library' },
    { name: 'Profile', href: '/profile' },
    { name: 'Billing', href: '/billing' },
    { name: 'Account Settings', href: '/settings' },
    { name: 'Support', href: '/support' }
  ]

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-3 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
              }
            `}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
} 