'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Star } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import CheckoutButton from '@/components/CheckoutButton'
import Reviews from '@/components/Reviews'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  thumbnail: string
  priceType: 'one_time' | 'subscription'
  currency: string
  features: string[]
  sampleInteractions: {
    question: string
    answer: string
  }[]
  reviews: {
    id: string
    rating: number
    comment: string
    userName: string
    date: string
  }[]
  tier: 'FREE' | 'PRO'
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        // Always fetch from API, never use mock data
        const response = await fetch(`/api/products/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch product')
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.error('Product fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const handleAddToLibrary = async () => {
    console.log('[AddToLibrary] Button clicked. Product:', product?.id)
    setAddLoading(true)
    setAddError('')
    try {
      console.log('[AddToLibrary] About to get session')
      const { data, error } = await supabase.auth.getSession()
      console.log('[AddToLibrary] getSession result:', data, error)
      const session = data?.session
      if (!session) throw new Error('Not authenticated')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      console.log('[AddToLibrary] Sending POST to:', `${backendUrl}/user/library`)
      const res = await fetch(`${backendUrl}/user/library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ productId: product?.id })
      })
      console.log('[AddToLibrary] Response status:', res.status)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.log('[AddToLibrary] Error response:', errData)
        throw new Error(errData.error || 'Failed to add product to library')
      }
      setAdded(true)
      console.log('[AddToLibrary] Product added successfully!')
    } catch (err: any) {
      setAddError(err.message || 'Error adding to library')
      console.error('[AddToLibrary] Caught error:', err)
    } finally {
      setAddLoading(false)
      console.log('[AddToLibrary] Done')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="text-center text-red-600">
            {error || 'Product not found'}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : product ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - Product info */}
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <div className="relative">
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${product.tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>{product.tier === 'PRO' ? 'PRO' : 'FREE'}</span>
                    </div>
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="mt-2 text-gray-600">{product.description}</p>
                  </div>

                  {/* Features */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                    <ul className="space-y-4">
                      {(product.features || []).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span className="ml-3 text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sample Interactions */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">User Reviews</h2>
                    <div className="space-y-4">
                      {(product.sampleInteractions || []).map((interaction, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="font-medium text-gray-900 mb-2">Q: {interaction.question}</p>
                          <p className="text-gray-600">A: {interaction.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews */}
                  <Reviews productId={product.id} className="mt-8" />
                </div>

                {/* Right column - Add to Library action */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
                    <div className="mb-4">
                      {added ? (
                        <span className="text-green-600 font-medium">Added to your library!</span>
                      ) : (
                        <button
                          onClick={handleAddToLibrary}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200 disabled:opacity-60"
                          disabled={addLoading}
                        >
                          {addLoading ? 'Adding...' : 'Add to My Library'}
                        </button>
                      )}
                      {addError && <span className="text-red-600 text-sm block mt-2">{addError}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}

function CheckIcon({ className = '' }) {
  return <Check className={className} />
}

function StarIcon({ className = '' }) {
  return <Star className={className} fill="currentColor" />
} 