'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams()
  const currentSection = searchParams?.get('section') || 'users';

  const navigation = [
    { name: 'Analytics', href: '/admin?section=analytics' },
    { name: 'Users', href: '/admin?section=users' },
    { name: 'Products', href: '/admin?section=products' },
    { name: 'Bundles', href: '/admin?section=bundles' },
    { name: 'Reviews', href: '/admin?section=reviews' },
    { name: 'Documentation', href: '/admin?section=documentation' },
    { name: 'Emails', href: '/admin/emails' }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 mt-2 flex justify-start px-3">
        <Link href="/admin">
          <span
            className="flex items-center px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#7F7BBA] font-sora text-base font-semibold shadow-sm hover:bg-gray-50 transition"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Admin
          </span>
        </Link>
      </div>
      <nav className="space-y-1 flex-1">
        {navigation.map((item) => {
          const section = item.href.split('=')[1] || '';
          const isActive = (item.name === 'Emails' && pathname === '/admin/emails') ||
            (pathname.startsWith('/admin') && currentSection === section && item.name !== 'Emails');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-700 hover:text-primary hover:bg-primary/10'
                }
              `}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 