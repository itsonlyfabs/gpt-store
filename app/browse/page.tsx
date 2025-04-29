'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ProductCard from '@/components/ProductCard'
import SearchBar from '@/components/SearchBar'
import SearchFilters from '@/components/SearchFilters'

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
}

const currencies = ['USD', 'EUR', 'GBP']
const priceTypes = [
  { id: 'one_time', name: 'One-time Purchase' },
  { id: 'subscription', name: 'Subscription' },
]
const categories = [
  'Focus & Concentration',
  'Meditation & Mindfulness',
  'Productivity',
  'Personal Development',
]
const priceRanges = [
  { id: '0-1000', name: 'Under $10', min: 0, max: 1000 },
  { id: '1000-2000', name: '$10 - $20', min: 1000, max: 2000 },
  { id: '2000-5000', name: '$20 - $50', min: 2000, max: 5000 },
  { id: '5000-99999', name: 'Over $50', min: 5000, max: 99999 },
]

export default function BrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    subscriptionType: 'all',
    sort: 'relevance'
  })

  useEffect(() => {
    fetchProducts()
  }, [filters])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Convert filters to URL params
      const params = new URLSearchParams({
        min_price: filters.priceRange.min.toString(),
        max_price: filters.priceRange.max.toString(),
        subscription_type: filters.subscriptionType,
        sort: filters.sort,
        search: searchQuery
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    setFilters(prev => ({
      ...prev,
      priceRange: range
    }))
  }

  const handleSubscriptionTypeChange = (type: string) => {
    setFilters(prev => ({
      ...prev,
      subscriptionType: type
    }))
  }

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({
      ...prev,
      sort
    }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const clearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 10000 },
      subscriptionType: 'all',
      sort: 'relevance'
    })
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header and Search */}
            <div className="flex flex-col space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Browse AI Tools</h1>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </button>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Search AI tools..."
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Filters</h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                </div>
                <SearchFilters
                  priceRange={filters.priceRange}
                  onPriceRangeChange={handlePriceRangeChange}
                  subscriptionType={filters.subscriptionType}
                  onSubscriptionTypeChange={handleSubscriptionTypeChange}
                  onSortChange={handleSortChange}
                />
              </div>

              {/* Products Grid */}
              <div className="flex-1">
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
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 