'use client'

import React, { useState, useCallback, useEffect, Suspense } from 'react'
import { debounce } from 'lodash'
import SearchBar from '../components/SearchBar'
import Sidebar from '@/components/Sidebar'
import ProductCard from '@/components/ProductCard'
import SearchFilters from '@/components/SearchFilters'
import SearchSuggestions from '../components/SearchSuggestions'
import { FiRefreshCw } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

type SubscriptionType = 'free' | 'pro' | 'all'
type SortBy = 'relevance' | 'newest' | 'price-asc' | 'price-desc'

interface Product {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  subscriptionType: 'one-time' | 'subscription'
  createdAt: string
  tier?: string
}

// Mock products for development
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'An AI-powered tool to help you maintain focus and concentration during work sessions.',
    category: 'Focus & Concentration',
    thumbnail: 'https://picsum.photos/seed/focus/800/400',
    subscriptionType: 'subscription',
    createdAt: '2024-01-01',
    tier: 'PRO'
  },
  {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation sessions with AI-guided breathing exercises and mindfulness techniques.',
    category: 'Meditation & Mindfulness',
    thumbnail: 'https://picsum.photos/seed/meditation/800/400',
    subscriptionType: 'subscription',
    createdAt: '2024-01-02',
    tier: 'PRO'
  },
  {
    id: '3',
    name: 'Productivity Boost AI',
    description: 'Smart task management and productivity optimization using AI-driven insights.',
    category: 'Productivity',
    thumbnail: 'https://picsum.photos/seed/productivity/800/400',
    subscriptionType: 'one-time',
    createdAt: '2024-01-03',
    tier: 'FREE'
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
  const [bundles, setBundles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [category, setCategory] = useState<string>('')
  const [itemType, setItemType] = useState<'all' | 'products' | 'bundles'>('all')
  const [showBundleAuthModal, setShowBundleAuthModal] = useState(false)
  const [bundleToView, setBundleToView] = useState<any | null>(null)
  const [tierFilter, setTierFilter] = useState<string>('');
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProducts(searchQuery)
    fetchBundles(searchQuery)
  }, [searchQuery, sortBy])

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true)
      setError('')
      const searchParams = new URLSearchParams({
        ...(query && { search: query }),
        ...(sortBy && { sort: sortBy })
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

  const fetchBundles = async (query: string) => {
    try {
      const searchParams = new URLSearchParams({
        ...(query && { search: query })
      })
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bundles?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }
      const data = await response.json()
      setBundles(data.filter((b: any) => !b.user_id))
    } catch (err) {
      console.error('Error fetching bundles:', err)
    }
  }

  const handleSearch = (newQuery: string) => {
    console.log('discover handleSearch', newQuery);
    setSearchQuery(newQuery);
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort as SortBy)
  }

  const handleCategoryClick = (cat: string) => {
    setCategory(cat)
    setSearchQuery(cat)
  }

  const handleReset = () => {
    setSearchQuery('');
    setCategory('');
    setSortBy('relevance');
    setItemType('all');
  }

  const handleBundleClick = async (bundle: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setBundleToView(bundle);
      setShowBundleAuthModal(true);
      return;
    }
    router.push(`/bundle/${bundle.id}`);
  };

  const tierFilteredProducts = tierFilter ? products.filter(p => (p.tier || 'FREE') === tierFilter) : products;
  const tierFilteredBundles = tierFilter ? bundles.filter(b => (b.tier || 'FREE') === tierFilter) : bundles;

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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.name)}
                      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-3xl mb-2">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
                {/* FREE/PRO filter */}
                <div className="flex gap-2 mb-2">
                  <button
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === '' ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary/30'}`}
                    onClick={() => setTierFilter('')}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === 'FREE' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-primary border-primary/30'}`}
                    onClick={() => setTierFilter('FREE')}
                  >
                    FREE
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === 'PRO' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-primary border-primary/30'}`}
                    onClick={() => setTierFilter('PRO')}
                  >
                    PRO
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Filters sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 mb-4">
                      <button
                        className={`flex-1 flex flex-col items-center p-3 rounded-lg shadow-sm border transition font-semibold text-base ${itemType === 'products' ? 'bg-primary text-white' : 'bg-white text-gray-900 border-gray-200 hover:bg-primary/10'}`}
                        onClick={() => setItemType('products')}
                      >
                        <span className="text-lg mb-1">🛒</span>
                        Products
                      </button>
                      <button
                        className={`flex-1 flex flex-col items-center p-3 rounded-lg shadow-sm border transition font-semibold text-base ${itemType === 'bundles' ? 'bg-primary text-white' : 'bg-white text-gray-900 border-gray-200 hover:bg-primary/10'}`}
                        onClick={() => setItemType('bundles')}
                      >
                        <span className="text-lg mb-1">📦</span>
                        Bundles
                      </button>
                    </div>
                    <SearchFilters
                      sortBy={sortBy}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1">
                  <div className="mb-6 flex items-center gap-2">
                    <SearchBar
                      value={searchQuery}
                      onChange={handleSearch}
                      onSearch={handleSearch}
                      placeholder="Search AI tools..."
                      className="max-w-2xl"
                    />
                    <button
                      className="ml-2 p-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors"
                      title="Reset filters"
                      onClick={handleReset}
                    >
                      <FiRefreshCw className="w-5 h-5 text-gray-500" />
                    </button>
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
                      {(itemType === 'all' || itemType === 'products') && tierFilteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          description={product.description}
                          category={product.category}
                          thumbnail={product.thumbnail}
                          tier={product.tier === 'PRO' ? 'PRO' : 'FREE'}
                        />
                      ))}
                      {(itemType === 'all' || itemType === 'bundles') && tierFilteredBundles.map((bundle) => (
                        <div
                          key={bundle.id}
                          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out p-8 flex flex-col items-center justify-center text-center cursor-pointer relative"
                          onClick={() => handleBundleClick(bundle)}
                        >
                          <div className="relative w-full">
                            <Image src={bundle.image} alt={bundle.name || 'Bundle image'} width={320} height={192} unoptimized className="w-full h-48 object-cover rounded-xl mb-4" />
                            <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${bundle.tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>{bundle.tier}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{bundle.name}</h3>
                          <p className="text-gray-500">{bundle.description}</p>
                          {Array.isArray(bundle.products) && bundle.products.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-2 justify-center w-full max-w-xs mx-auto">
                              {bundle.products.map((product: any) => (
                                <span
                                  key={product.id}
                                  className="px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium shadow-sm cursor-default transition-colors duration-150 text-center truncate"
                                >
                                  {product.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Bundle Auth Modal */}
      {showBundleAuthModal && bundleToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowBundleAuthModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign up for free to unlock bundle details!</h2>
            <p className="text-gray-600 mb-4">Create a free account to access bundle details and enjoy these benefits:</p>
            <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Access exclusive AI bundles</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Save your favorites</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Get personalized recommendations</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> 100% free, no credit card required</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  localStorage.setItem('redirectAfterLogin', `/bundle/${bundleToView.id}`);
                  router.push('/auth/register');
                }}
                className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Sign up for free
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('redirectAfterLogin', `/bundle/${bundleToView.id}`);
                  router.push('/auth/login');
                }}
                className="w-full sm:w-auto px-6 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  )
} 