'use client'

import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { debounce } from 'lodash'
import SearchBar from '@/components/SearchBar'
import Sidebar from '@/components/Sidebar'
import ProductCard from '@/components/ProductCard'
import SearchFilters from '@/components/SearchFilters'
import SearchSuggestions from '@/components/SearchSuggestions'

type SubscriptionType = 'subscription' | 'one-time' | 'all'
type SortBy = 'relevance' | 'price-asc' | 'price-desc' | 'newest'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  thumbnail: string
  priceType: 'one_time' | 'subscription'
  currency: string
  subscriptionType: 'one-time' | 'subscription'
  createdAt: string
}

// Mock products for development
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'An AI-powered tool to help you maintain focus and concentration during work sessions.',
    price: 2999,
    category: 'Focus & Concentration',
    thumbnail: 'https://picsum.photos/seed/focus/800/400',
    priceType: 'subscription',
    currency: 'USD',
    subscriptionType: 'subscription',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation sessions with AI-guided breathing exercises and mindfulness techniques.',
    price: 1999,
    category: 'Meditation & Mindfulness',
    thumbnail: 'https://picsum.photos/seed/meditation/800/400',
    priceType: 'subscription',
    currency: 'USD',
    subscriptionType: 'subscription',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'Productivity Boost AI',
    description: 'Smart task management and productivity optimization using AI-driven insights.',
    price: 3999,
    category: 'Productivity',
    thumbnail: 'https://picsum.photos/seed/productivity/800/400',
    priceType: 'one_time',
    currency: 'USD',
    subscriptionType: 'one-time',
    createdAt: '2024-01-03'
  },
]

const categories = [
  { id: 'focus', name: 'Focus & Concentration', icon: '🎯' },
  { id: 'meditation', name: 'Meditation & Mindfulness', icon: '🧘‍♂️' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'creativity', name: 'Creativity', icon: '🎨' },
  { id: 'stress', name: 'Stress Management', icon: '🌿' },
  { id: 'sleep', name: 'Sleep & Recovery', icon: '😴' },
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')

  useEffect(() => {
    fetchProducts(searchQuery)
  }, [searchQuery, priceRange, subscriptionType, sortBy])

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true)
      setError('')

      // Always fetch from backend API
      const searchParams = new URLSearchParams({
        ...(query && { search: query }),
        ...(subscriptionType !== 'all' && { priceType: subscriptionType === 'subscription' ? 'subscription' : 'one_time' })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (newQuery: string) => {
    setSearchQuery(newQuery)
  }

  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    setPriceRange(range)
  }

  const handleSubscriptionTypeChange = (type: SubscriptionType) => {
    setSubscriptionType(type)
  }

  const handleSortChange = (sort: SortBy) => {
    setSortBy(sort)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Categories */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSearch(category.name)}
                      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-3xl mb-2">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Filters sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <SearchFilters
                      priceRange={priceRange}
                      onPriceRangeChange={handlePriceRangeChange}
                      subscriptionType={subscriptionType}
                      onSubscriptionTypeChange={handleSubscriptionTypeChange}
                      sortBy={sortBy}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1">
                  <div className="mb-6">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSearch={handleSearch}
                      placeholder="Search AI tools..."
                      className="max-w-2xl"
                    />
                    {searchQuery && (
                      <SearchSuggestions
                        query={searchQuery}
                        onSuggestionClick={handleSearch}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                          <div className="bg-white p-4 rounded-b-lg">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          description={product.description}
                          price={product.price}
                          category={product.category}
                          thumbnail={product.thumbnail}
                          priceType={product.priceType}
                          currency={product.currency}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Suspense>
  )
} 