'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface PurchasedProduct {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  lastUsed: string
  usageMetrics: {
    totalChats: number
    totalTokens: number
    lastChatDate: string
  }
}

// Mock data for development
const MOCK_PRODUCTS: PurchasedProduct[] = [
  {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'AI-powered tool to help you maintain focus and concentration during work sessions.',
    thumbnail: 'https://picsum.photos/seed/focus/800/400',
    category: 'Focus & Concentration',
    lastUsed: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    usageMetrics: {
      totalChats: 15,
      totalTokens: 3500,
      lastChatDate: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation sessions with AI-guided breathing exercises.',
    thumbnail: 'https://picsum.photos/seed/meditation/800/400',
    category: 'Meditation & Mindfulness',
    lastUsed: new Date(Date.now() - 172800000).toISOString(), // 48 hours ago
    usageMetrics: {
      totalChats: 8,
      totalTokens: 2100,
      lastChatDate: new Date(Date.now() - 172800000).toISOString(),
    },
  },
]

export default function MyLibraryPage() {
  const [products, setProducts] = useState<PurchasedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // In development, use mock data
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
          setProducts(MOCK_PRODUCTS)
          return
        }

        // In production, fetch from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/library`)
        if (!response.ok) {
          throw new Error('Failed to fetch purchased products')
        }
        const data = await response.json()
        setProducts(data.products)
      } catch (err) {
        console.error('Error fetching library:', err)
        setError(err instanceof Error ? err.message : 'Failed to load your library')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedProducts()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
              <p className="mt-2 text-sm text-gray-600">
                Access your purchased AI tools and view usage statistics
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Discover More Tools
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
              <p className="text-gray-600 mb-6">
                Explore our collection of AI tools to enhance your mental fitness journey
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse AI Tools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Chats</p>
                          <p className="font-medium text-gray-900">
                            {product.usageMetrics.totalChats}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Used</p>
                          <p className="font-medium text-gray-900">
                            {new Date(product.lastUsed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/chat/${product.id}`}
                      className="mt-6 w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Open Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 