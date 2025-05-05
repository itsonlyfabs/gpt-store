'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from 'app/utils/supabase'
import dynamic from 'next/dynamic'

function LoginForm() {
  console.log('LoginForm component mounted')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed in component:', event, session?.user?.email)
      if (event === 'SIGNED_IN' && session) {
        try {
          setRedirecting(true)
          const redirectTo = searchParams.get('redirectTo') || '/discover'
          console.log('Redirecting to:', redirectTo)
          
          // Force a small delay to ensure session is properly set
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Use window.location for a hard redirect
          window.location.href = redirectTo
        } catch (err) {
          console.error('Redirect error:', err)
          setError('Failed to redirect after login. Please try refreshing the page.')
          setRedirecting(false)
        }
      }
    })

    // Check for verification status
    const verified = searchParams.get('verified')
    const verificationError = searchParams.get('error')

    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.')
    } else if (verificationError === 'verification_failed') {
      setError('Email verification failed. Please try again or contact support.')
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, router])

  if (!isClient) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit called')
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      console.log('Login form submitted for:', formData.email)

      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required')
      }

      // Sign in with Supabase
      console.log('Calling supabase.auth.signInWithPassword...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      console.log('Sign in response:', data, signInError)

      if (signInError) {
        console.error('Sign in error details:', signInError)
        throw signInError
      }

      if (!data?.session) {
        throw new Error('Authentication failed. Please try again.')
      }

      // The redirect will be handled by the auth state change listener
      console.log('Login successful, waiting for redirect...')

    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to login. Please check your credentials.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="relative">
      {redirecting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={loading || redirecting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={loading || redirecting}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || redirecting}
            onClick={() => console.log('Sign in button clicked')}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || redirecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : redirecting ? 'Redirecting...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}

const ClientLoginForm = dynamic(() => Promise.resolve(LoginForm), { ssr: false })

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      type="login"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ClientLoginForm />
      </Suspense>
    </AuthLayout>
  )
} 