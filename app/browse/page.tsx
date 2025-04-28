'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ProductCard from '@/components/ProductCard'
import SearchBar from '@/components/SearchBar'

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
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    priceType: searchParams.get('priceType') || '',
    currency: searchParams.get('currency') || 'USD',
    priceRange: searchParams.get('priceRange') || '',
    search: searchParams.get('search') || '',
  })

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')
      try {
        // Remove empty filters
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
        
        const queryParams = new URLSearchParams(activeFilters).toString()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryParams}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        
        // Apply price range filter client-side
        let filteredData = [...data]
        if (filters.priceRange) {
          const range = priceRanges.find(r => r.id === filters.priceRange)
          if (range) {
            filteredData = filteredData.filter(
              p => p.price >= range.min && p.price <= range.max
            )
          }
        }
        
        setProducts(filteredData)
      } catch (error) {
        console.error('Error fetching products:', error)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Update URL query params
    const newParams = new URLSearchParams(searchParams.toString())
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    router.push(`/browse?${newParams.toString()}`)
  }

  const handleSearch = (query: string) => {
    handleFilterChange('search', query)
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      priceType: '',
      currency: 'USD',
      priceRange: '',
      search: '',
    })
    router.push('/browse')
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
                onSearch={handleSearch}
                placeholder="Search AI tools..."
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <select
                value={filters.priceType}
                onChange={(e) => handleFilterChange('priceType', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Price Types</option>
                {priceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Prices</option>
                {priceRanges.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-8">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 