'use client'

import React, { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: string
  features: string[]
  is_popular?: boolean
}

export default function PricingPage() {
  const router = useRouter()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    fetch(`/api/plans?interval=${billingInterval}`)
      .then(res => res.json())
      .then(data => setPlans(data.filter((plan: Plan) => plan.name === 'Free' || plan.name === 'Pro')))
  }, [billingInterval])

  const handleAction = (planId: string) => {
    // Redirect to login with a callback to the subscription flow
    router.push(`/login?redirect=/subscribe?plan=${planId}&interval=${billingInterval}`)
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
                YEARLY <span className="ml-1 text-xs text-green-600 font-semibold">(SAVE 20%)</span>
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
                    onClick={() => handleAction(plan.id)}
                    className={`mt-8 w-full rounded-lg px-4 py-2 text-center font-medium ${
                      plan.is_popular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Subscribe'}
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