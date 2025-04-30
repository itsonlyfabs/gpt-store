'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setVerificationStatus('error')
        setErrorMessage('No session ID provided')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Send auth token if available
          },
          body: JSON.stringify({ sessionId })
        })

        if (!response.ok) {
          throw new Error('Failed to verify session')
        }

        const data = await response.json()
        setVerificationStatus('success')
      } catch (error) {
        console.error('Session verification failed:', error)
        setVerificationStatus('error')
        setErrorMessage('Failed to verify your purchase. Please contact support.')
      }
    }

    verifySession()
  }, [sessionId])

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifying your purchase...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <div className="space-x-4">
            <Link href="/discover" className="text-blue-600 hover:underline">
              Return to Discover
            </Link>
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">🎉 Thank you for your purchase!</h1>
        <p className="text-lg mb-8">Your AI tool is now ready to use in your library.</p>
        <div className="space-x-4">
          <Link
            href="/my-library"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to My Library
          </Link>
          <Link
            href="/discover"
            className="text-blue-600 hover:underline"
          >
            Discover More Tools
          </Link>
        </div>
      </div>
    </div>
  )
} 