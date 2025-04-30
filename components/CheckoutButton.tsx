'use client'

import React, { useState } from 'react'

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

  const handleCheckout = async () => {
    try {
      setLoading(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          priceType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
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
      alert('Failed to initiate checkout. Please try again.')
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