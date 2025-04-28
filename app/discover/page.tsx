'use client'

import React, { useState, useCallback } from 'react'
import { debounce } from 'lodash'
import SearchBar from '@/components/SearchBar'
import Sidebar from '@/components/Sidebar'
import ProductCard from '@/components/ProductCard'
import SearchFilters from '@/components/SearchFilters'
import SearchSuggestions from '@/components/SearchSuggestions'

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
  const [query, setQuery] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [subscriptionType, setSubscriptionType] = useState<'all' | 'one-time' | 'subscription'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'newest'>('relevance')
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (process.env.NODE_ENV === 'development') {
        // For development, filter mock products
        const filtered = MOCK_PRODUCTS.filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        )
        setProducts(filtered)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error searching products:', error)
      setError('Failed to search products. Please try again.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce the search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => fetchProducts(query), 300),
    []
  )

  const handleSearch = async (newQuery: string) => {
    setQuery(newQuery)
    // In a real app, this would trigger an API call with all filters
    const filtered = MOCK_PRODUCTS.filter(product => {
      const matchesQuery = product.name.toLowerCase().includes(newQuery.toLowerCase())
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max
      const matchesType = subscriptionType === 'all' || product.subscriptionType === subscriptionType
      return matchesQuery && matchesPrice && matchesType
    })

    let sorted = [...filtered]
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      default:
        // relevance - keep original order
        break
    }

    setProducts(sorted)
  }

  const handleCategoryClick = (categoryName: string) => {
    fetchProducts(categoryName)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Discover AI Tools</h1>
            <div className="relative mb-8">
              <SearchBar 
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                placeholder="Search AI products..."
                className="w-full"
              />
              <SearchSuggestions
                query={query}
                onSuggestionClick={suggestion => {
                  setQuery(suggestion)
                  handleSearch(suggestion)
                }}
                className="absolute w-full mt-1 z-10"
              />
            </div>
            
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Categories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Tools</h2>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found. Try a different search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <SearchFilters
                      priceRange={priceRange}
                      onPriceRangeChange={setPriceRange}
                      subscriptionType={subscriptionType}
                      onSubscriptionTypeChange={setSubscriptionType}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 