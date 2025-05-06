'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  type: 'login' | 'register' | 'forgot-password' | 'reset-password'
}

export default function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <Image src="/genio logo dark.png" alt="Genio Logo" width={180} height={40} priority />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
          <div className="mt-6">
            {type === 'login' && (
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
                    Sign up
                  </Link>
                </p>
                <p className="text-center text-sm text-gray-600">
                  <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80">
                    Forgot your password?
                  </Link>
                </p>
              </div>
            )}
            {type === 'register' && (
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            )}
            {type === 'forgot-password' && (
              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            )}
            {type === 'reset-password' && (
              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 