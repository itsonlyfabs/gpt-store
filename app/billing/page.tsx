'use client'

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiCreditCard, FiUser, FiBell, FiLock } from 'react-icons/fi'
import { Check } from 'lucide-react'

interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string
  cancel_at_period_end: boolean
  plan: Plan | null
  canceled_at?: string
}

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  isDefault: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  description: string
  features: string[]
  is_popular: boolean
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'subscription' | 'payment' | 'account'>('subscription')
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchSubscriptionData()
    fetchPlans()
  }, [billingInterval])

  const fetchSubscriptionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Fetch subscription data
      const subscriptionRes = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!subscriptionRes.ok) throw new Error('Failed to fetch subscription')
      const subscriptionData = await subscriptionRes.json()

      if (subscriptionData && subscriptionData.plan && subscriptionData.plan.amount !== undefined) {
        subscriptionData.plan = {
          id: '',
          name: subscriptionData.plan.name,
          price: subscriptionData.plan.amount,
          interval: subscriptionData.plan.interval,
          description: '',
          features: [],
          is_popular: false
        }
      }
      setSubscription(subscriptionData)

      // Fetch payment methods
      const paymentMethodsRes = await fetch('/api/user/payment-methods', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!paymentMethodsRes.ok) throw new Error('Failed to fetch payment methods')
      const paymentMethodsData = await paymentMethodsRes.json()
      setPaymentMethods(paymentMethodsData)

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const plansRes = await fetch(`/api/plans?interval=${billingInterval}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!plansRes.ok) throw new Error('Failed to fetch plans')
      const plansData = await plansRes.json()
      setPlans(plansData)
    } catch (err) {
      setPlans([])
    }
  }

  const handleCancelSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) throw new Error('Failed to cancel subscription')
      
      setSuccess('Your subscription will be canceled at the end of the current billing period')
      fetchSubscriptionData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/user/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) throw new Error('Failed to reactivate subscription')
      
      setSuccess('Your subscription has been reactivated')
      fetchSubscriptionData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription')
    }
  }

  const handleUpdatePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/user/payment-methods/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethodId })
      })

      if (!res.ok) throw new Error('Failed to update payment method')
      
      setSuccess('Payment method updated successfully')
      fetchSubscriptionData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method')
    }
  }

  const handleSubscribe = async (planId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/user/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      })

      if (!res.ok) throw new Error('Failed to subscribe to plan')
      
      setSuccess('You have successfully subscribed to the new plan')
      fetchSubscriptionData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to plan')
    }
  }

  const filteredPlans = plans.filter(plan => plan.name === 'Free' || plan.name === 'Pro')

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account & Billing</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`${
                  activeTab === 'subscription'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <FiCreditCard />
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`${
                  activeTab === 'payment'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <FiCreditCard />
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`${
                  activeTab === 'account'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <FiUser />
                Account Settings
              </button>
            </nav>
          </div>

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-8">
              {/* Current Plan */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Current Plan</p>
                        <p className="text-lg font-medium text-gray-900">{subscription.plan?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-medium text-gray-900">
                          {subscription.plan && typeof subscription.plan.price === 'number' ? (
                            subscription.plan.price === 0 ? 'Free' : `$${(subscription.plan.price / 100).toFixed(2)}`
                          ) : '-'}
                          {subscription.plan && typeof subscription.plan.price === 'number' && subscription.plan.price !== 0 ? (billingInterval === 'month' ? '/month' : '/user/month') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-lg font-medium text-gray-900 capitalize">
                          {subscription.cancel_at_period_end
                            ? 'Canceling'
                            : subscription.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {subscription.cancel_at_period_end ? 'Cancelling From' : 'Next Billing Date'}
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          {subscription.cancel_at_period_end
                            ? (subscription.canceled_at ? new Date(subscription.canceled_at).toLocaleDateString() : '-')
                            : (subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '-')}
                        </p>
                      </div>
                    </div>
                    {subscription.plan?.price !== 0 && subscription.cancel_at_period_end ? (
                      <div className="mt-4">
                        <p className="text-yellow-600 mb-2">
                          Your subscription will end on {subscription.canceled_at ? new Date(subscription.canceled_at).toLocaleDateString() : (subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '-')}
                        </p>
                        <button
                          onClick={handleReactivateSubscription}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          Reactivate Subscription
                        </button>
                      </div>
                    ) : null}
                    {subscription.plan?.price !== 0 && !subscription.cancel_at_period_end ? (
                      <button
                        onClick={handleCancelSubscription}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Cancel Subscription
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You don't have an active subscription</p>
                  </div>
                )}
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

              {/* Available Plans */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPlans.map((plan) => {
                    const isCurrent = subscription && plan.id === subscription.plan?.id
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-lg border ${
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
                          <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                          <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                          <p className="mt-4">
                            <span className="text-2xl font-bold text-gray-900">
                              {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`}
                            </span>
                            <span className="text-gray-500">{plan.price === 0 ? '' : billingInterval === 'month' ? '/month' : '/user/month'}</span>
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
                            onClick={() => handleSubscribe(plan.id)}
                            className={`mt-8 w-full rounded-lg px-4 py-2 text-center font-medium ${
                              plan.price > (subscription ? subscription.plan?.price || 0 : 0)
                                ? 'bg-primary text-white hover:bg-primary/90'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            {plan.price > (subscription ? subscription.plan?.price || 0 : 0)
                              ? 'Upgrade'
                              : 'Downgrade'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
              {paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <FiCreditCard className="text-gray-400" size={24} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ending in {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      {method.isDefault ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdatePaymentMethod(method.id)}
                          className="text-primary hover:text-primary/80"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No payment methods added</p>
                  <button
                    onClick={() => window.location.href = '/discover'}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive updates about your account and subscription</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                        <p className="text-sm text-gray-500">Receive updates about new features and products</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                  <div className="space-y-4">
                    <button
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <span>Change Password</span>
                      <FiLock className="text-gray-400" />
                    </button>
                    <button
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <span>Two-Factor Authentication</span>
                      <FiLock className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 