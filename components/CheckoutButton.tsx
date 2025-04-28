import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

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
  const [error, setError] = useState('')
  const [devMessage, setDevMessage] = useState('')

  const handleCheckout = async () => {
    try {
      setLoading(true)
      setError('')
      setDevMessage('')

      // Create a checkout session on the server
      const response = await fetch(`/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          priceType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Handle development mode
      if (data.devMode) {
        setDevMessage(data.message)
        // Simulate successful checkout after 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000))
        window.location.href = '/checkout/success?session_id=' + data.sessionId
        return
      }

      // Production mode - redirect to Stripe checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe is not properly configured')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
      {devMessage && (
        <div className="mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          {devMessage}
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          'Purchase Now'
        )}
      </button>
    </div>
  )
} 