"use client"

import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: string
  tier: string
  features: string[]
  is_popular?: boolean
}

interface Subscription {
  id: string
  plan_id: string
  status: string
  current_period_end: string
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  useEffect(() => {
    fetchPlansAndSubscription()
  }, [billingInterval])

  const fetchPlansAndSubscription = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch plans
      const plansRes = await fetch(`/api/plans?interval=${billingInterval}`)
      if (!plansRes.ok) throw new Error('Failed to fetch plans')
      const plansData = await plansRes.json()
      setPlans(plansData)

      // Fetch current subscription
      const subRes = await fetch('/api/user/subscription')
      if (!subRes.ok) throw new Error('Failed to fetch subscription')
      const subData = await subRes.json()
      setSubscription(subData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (planId: string) => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/user/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      if (!res.ok) throw new Error('Failed to change plan')
      setSuccess('Plan changed successfully!')
      fetchPlansAndSubscription()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan')
    }
  }

  const filteredPlans = plans.filter(plan => plan.name === 'Free' || plan.name === 'Pro')

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full flex items-center justify-start px-4 pt-6 pb-2">
        <a href="/">
          <img src="/genio-logo-dark.png" alt="Genio Logo" width={180} height={40} />
        </a>
      </div>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl px-4 py-12 mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Manage your plan
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Upgrade, downgrade, or view your current membership
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
                YEARLY <span className="ml-1 text-xs text-green-600 font-semibold">(SAVE 20%)</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg text-center">
              {success}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {filteredPlans.map((plan) => {
              const isCurrent = subscription && plan.id === subscription.plan_id
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border ${
                    plan.is_popular
                      ? 'border-primary shadow-lg'
                      : 'border-gray-200'
                  } bg-white p-8 ${isCurrent ? 'ring-2 ring-primary' : ''}`}
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
                        {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`}
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
                  {isCurrent ? (
                    <div className="mt-8 w-full rounded-lg px-4 py-2 text-center font-medium bg-gray-100 text-primary border border-primary">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      className={`mt-8 w-full rounded-lg px-4 py-2 text-center font-medium ${
                        plan.price > (subscription ? plans.find(p => p.id === subscription.plan_id)?.price || 0 : 0)
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {plan.price > (subscription ? plans.find(p => p.id === subscription.plan_id)?.price || 0 : 0)
                        ? 'Upgrade'
                        : 'Downgrade'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
} 