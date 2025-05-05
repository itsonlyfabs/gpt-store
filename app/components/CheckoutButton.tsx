'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from 'app/utils/supabase'

interface CheckoutButtonProps {
  productId: string
  priceType: 'one_time' | 'subscription'
  disabled?: boolean
  className?: string
}

export default function CheckoutButton({
  productId,
  priceType,
  disabled = false,
  className = '',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    let handled = false
    try {
      setLoading(true)

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          priceType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (
          response.status === 400 &&
          (errorData.error?.toLowerCase().includes('already own') || errorData.code === 'ALREADY_PURCHASED')
        ) {
          console.log('Detected already purchased, showing custom UI')
          setAlreadyPurchased(true)
          handled = true
          setTimeout(() => {
            router.push('/my-library')
          }, 3000)
          return
        }
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()

      if (process.env.NODE_ENV === 'development') {
        router.push(data.success_url)
        return
      }

      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!stripePublishableKey) {
        throw new Error('Stripe publishable key is not configured')
      }

      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(stripePublishableKey)

      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      if (!alreadyPurchased && !handled) {
        alert(error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (alreadyPurchased) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center p-4">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-2">You Already Own This Product</h1>
          <p>This product is already in your library.</p>
          <p className="mt-2">Redirecting you to your library...</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? 'Processing...' : 'Purchase Now'}
    </button>
  )
} 