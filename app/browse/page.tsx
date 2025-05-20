'use client'

import React, { useState, useEffect, Suspense } from 'react'
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

interface Filters {
  priceRange: PriceRange
  sortBy: string
  query: string
}

interface PriceRange {
  min: number;
  max: number;
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

function BrowsePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>({
    priceRange: { min: 0, max: 10000 },
    sortBy: 'relevance',
    query: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [filters])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')

      // In development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
        
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Focus Enhancement AI',
            description: 'Boost your concentration and productivity with AI-powered techniques.',
            price: 2999,
            category: 'Productivity',
            thumbnail: 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?auto=format&fit=crop&w=800',
            priceType: 'subscription',
            currency: 'USD',
            features: [
              'Real-time focus tracking',
              'Personalized productivity tips',
              'Distraction management',
              'Progress analytics'
            ]
          },
          {
            id: '2',
            name: 'Meditation Guide AI',
            description: 'Personal AI meditation coach for mindfulness and stress relief.',
            price: 1999,
            category: 'Wellness',
            thumbnail: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800',
            priceType: 'one_time',
            currency: 'USD',
            features: [
              'Guided meditations',
              'Breathing exercises',
              'Sleep stories',
              'Stress tracking'
            ]
          }
        ]

        // Apply filters
        let filtered = [...mockProducts]

        // Filter by price
        filtered = filtered.filter(product => 
          product.price >= filters.priceRange.min && 
          product.price <= filters.priceRange.max
        )

        // Filter by search query
        if (filters.query) {
          const query = filters.query.toLowerCase()
          filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
          )
        }

        // Sort products
        switch (filters.sortBy) {
          case 'relevance':
            // relevance - keep default order
            break
          case 'newest':
            // In a real app, we would sort by creation date
            break
          default:
            // Handle other cases if needed
            break
        }

        setProducts(filtered)
        return
      }

      // Production mode
      const queryParams = new URLSearchParams({
        query: filters.query,
        minPrice: filters.priceRange.min.toString(),
        maxPrice: filters.priceRange.max.toString(),
        sortBy: filters.sortBy
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryParams}`)
      
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

  const handlePriceRangeChange = (range: PriceRange) => {
    setFilters(prev => ({ ...prev, priceRange: range }))
  }

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sortBy: sort }))
  }

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }))
  }

  const clearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 10000 },
      sortBy: 'relevance',
      query: ''
    })
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <SearchFilters
                sortBy={filters.sortBy as string}
                onSortChange={handleSortChange}
              />
              <button
                onClick={clearFilters}
                className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6">
              <SearchBar
                value={filters.query}
                onChange={handleSearch}
                onSearch={handleSearch}
                placeholder="Search AI tools..."
                className="max-w-2xl"
              />
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                    <div className="bg-white p-4 rounded-b-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-3 mt-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
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
                    category={product.category}
                    thumbnail={product.thumbnail}
                    tier={product.priceType === 'subscription' ? 'PRO' : 'FREE'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowsePageInner />
    </Suspense>
  )
} 