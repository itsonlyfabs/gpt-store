'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

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
  const router = useRouter()

  const handleCheckout = async () => {
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
          // Token expired or invalid, redirect to login
          router.push('/auth/login')
          return
        }
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      // If we're in development mode, use the success_url from the response
      if (process.env.NODE_ENV === 'development') {
        window.location.href = data.success_url
        return
      }

      // For production, redirect to Stripe checkout
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!stripePublishableKey) {
        throw new Error('Stripe publishable key is not configured')
      }

      const stripe = await import('@stripe/stripe-js').then((module) => 
        module.loadStripe(stripePublishableKey)
      )
      
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
      alert(error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.')
    } finally {
      setLoading(false)
    }
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