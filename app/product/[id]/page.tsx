'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import CheckoutButton from '@/components/CheckoutButton'
import Reviews from '@/components/Reviews'

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
}

// Mock data for development
const MOCK_PRODUCT: Product = {
  id: '1',
  name: 'Focus Enhancement AI',
  description: 'An AI-powered tool to help you maintain focus and concentration during work sessions.',
  price: 2999,
  category: 'Focus & Concentration',
  thumbnail: 'https://picsum.photos/800/400',
  priceType: 'subscription',
  currency: 'USD',
  features: [
    'Real-time focus tracking',
    'Personalized concentration exercises',
    'Break time recommendations',
    'Progress analytics',
  ],
  sampleInteractions: [
    {
      question: 'How can I improve my focus?',
      answer: 'I can help you create a personalized focus enhancement plan based on your work patterns and preferences.',
    },
    {
      question: 'When should I take breaks?',
      answer: 'Based on research, I recommend taking a 5-minute break every 25 minutes of focused work.',
    },
  ],
  reviews: [
    {
      id: '1',
      rating: 5,
      comment: 'This tool has significantly improved my productivity!',
      userName: 'John Doe',
      date: '2024-03-15',
    },
    {
      id: '2',
      rating: 4,
      comment: 'Very helpful for maintaining focus during long work sessions.',
      userName: 'Jane Smith',
      date: '2024-03-14',
    },
  ],
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        if (process.env.NODE_ENV === 'development') {
          // In development, return mock data after a small delay
          await new Promise(resolve => setTimeout(resolve, 500))
          setProduct(MOCK_PRODUCT)
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch product')
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.error('Product fetch error:', err)
        if (process.env.NODE_ENV === 'development') {
          // In development, fallback to mock data even if fetch fails
          setProduct(MOCK_PRODUCT)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load product')
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

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
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="mt-2 text-gray-600">{product.description}</p>
                  </div>

                  {/* Features */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                    <ul className="space-y-4">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span className="ml-3 text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sample Interactions */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sample Interactions</h2>
                    <div className="space-y-4">
                      {product.sampleInteractions.map((interaction, index) => (
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

                {/* Right column - Pricing and actions */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: product.currency
                        }).format(product.price / 100)}
                      </span>
                      {product.priceType === 'subscription' && (
                        <span className="text-gray-500 ml-2">/month</span>
                      )}
                    </div>

                    <CheckoutButton
                      productId={product.id}
                      priceType={product.priceType}
                      className="w-full"
                    />
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
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function StarIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
} 