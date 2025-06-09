'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Check } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: string
  features: string[]
  is_popular?: boolean
}

export default function PricingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingPage />
    </Suspense>
  )
}

function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [plans, setPlans] = useState<Plan[]>([])
  const supabase = createClientComponentClient()
  const [autoCheckoutTriggered, setAutoCheckoutTriggered] = useState(false)
  const autoCheckoutIntent = useRef<{planName?: string, interval?: 'month' | 'year'} | null>(null)

  useEffect(() => {
    fetch(`/api/plans?interval=${billingInterval}`)
      .then(res => res.json())
      .then(data => setPlans(data.filter((plan: Plan) => plan.name === 'Free' || plan.name === 'Pro')))
  }, [billingInterval])

  // Capture intent on mount if redirected after login
  useEffect(() => {
    const startCheckout = searchParams?.get('startCheckout') === '1'
    const planName = searchParams?.get('plan')
    const interval = searchParams?.get('interval') as 'month' | 'year' | null
    if (startCheckout && planName && interval) {
      autoCheckoutIntent.current = { planName, interval }
    }
  }, [searchParams])

  // Always check for auto-checkout intent after plans and session are available
  useEffect(() => {
    if (!autoCheckoutIntent.current) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || plans.length === 0) return
      const { planName, interval } = autoCheckoutIntent.current!
      const plan = plans.find(p => p.name.toLowerCase() === planName!.toLowerCase())
      if (plan && interval) {
        setBillingInterval(interval)
        if (!autoCheckoutTriggered) {
          setAutoCheckoutTriggered(true)
          autoCheckoutIntent.current = null
          handleAction(plan, interval)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans])

  const handleAction = async (plan: Plan, intervalOverride?: 'month' | 'year') => {
    const { data: { session } } = await supabase.auth.getSession()
    const intervalToUse = intervalOverride || billingInterval
    if (!session) {
      if (plan.price === 0) {
        router.push(`/auth/login?redirectTo=/discover`)
      } else {
        const redirectUrl = `/pricing?plan=${plan.name.toLowerCase()}&interval=${intervalToUse}&startCheckout=1`
        router.push(`/auth/login?redirectTo=${encodeURIComponent(redirectUrl)}`)
      }
      return
    }

    if (plan.price === 0) {
      const res = await fetch('/api/user/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Subscription failed')
        return
      }
      router.push('/discover')
    } else {
      try {
        const res = await fetch('/api/plans/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ planId: plan.id, source: 'pricing' })
        })
        const data = await res.json()
        if (!res.ok || !data.sessionId) {
          alert(data.error || 'Failed to start checkout')
          return
        }
        const { loadStripe } = await import('@stripe/stripe-js')
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        if (!stripe) {
          alert('Stripe failed to load')
          return
        }
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      } catch (err) {
        alert('Failed to start checkout')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo header */}
      <div className="w-full flex items-center justify-start px-4 pt-6 pb-2">
        <a href="/">
          <Image src="/genio logo dark.png" alt="Genio Logo" width={180} height={40} priority />
        </a>
      </div>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl px-4 py-12 mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Choose the plan that best fits your needs
            </p>
          </div>

          {/* Billing interval toggle */}
          <div className="flex justify-center mt-8 mb-8">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingInterval === 'month' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                onClick={() => setBillingInterval('month')}
              >
                MONTHLY
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingInterval === 'year' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                onClick={() => setBillingInterval('year')}
              >
                YEARLY <span className="ml-1 text-xs text-green-600 font-semibold">(SAVE 30%)</span>
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="grid gap-8 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border ${
                    plan.is_popular
                      ? 'border-primary shadow-lg'
                      : 'border-gray-200'
                  } bg-white p-8`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                    <p className="mt-2 text-gray-600">{plan.description}</p>
                    <p className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0
                          ? 'Free'
                          : `$${(plan.price / 100).toFixed(2)}`}
                      </span>
                      <span className="text-gray-600">{plan.price === 0 ? '' : billingInterval === 'month' ? '/month' : '/user/month'}</span>
                    </p>
                  </div>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleAction(plan)}
                    className={`mt-8 w-full rounded-lg px-4 py-2 text-center font-medium ${
                      plan.is_popular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 