'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function CheckoutSuccessPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const productId = searchParams?.get('product_id')
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function verifySession() {
      try {
        if (!sessionId || !productId) {
          setVerificationStatus('error')
          setErrorMessage('Missing session or product information')
          return
        }

        // Get current user
        const { data: { session: userSession } } = await supabase.auth.getSession()
        if (!userSession) {
          setVerificationStatus('error')
          setErrorMessage('Authentication required')
          router.push('/auth/login')
          return
        }

        // Verify the purchase
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.access_token}`,
          },
          body: JSON.stringify({
            sessionId,
            productId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to verify purchase')
        }

        // Purchase verified successfully
        setVerificationStatus('success')
        
        // Redirect to library after a short delay
        setTimeout(() => {
          router.push('/my-library')
        }, 3000)
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to verify purchase')
      }
    }

    verifySession()
  }, [sessionId, productId, router])

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verifying your purchase...</h1>
        <p className="text-gray-600">Please wait while we confirm your payment.</p>
      </div>
    )
  }
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full">
          <h1 className="font-bold mb-2">Verification Failed</h1>
          <p>{errorMessage || 'An error occurred during purchase verification.'}</p>
          <button
            onClick={() => router.push('/browse')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Return to Browse
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-2">Thank You for Your Purchase!</h1>
        <p>Your purchase has been confirmed.</p>
        <p className="mt-2">Redirecting you to your library...</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessPageInner />
    </Suspense>
  )
} 