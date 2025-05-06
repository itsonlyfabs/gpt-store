'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SearchBar from '../components/SearchBar'
import CategoryDropdown from '../components/CategoryDropdown'
import RefreshButton from '../components/RefreshButton'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
      setFiltered(data)
    } catch {
      setProducts([])
      setFiltered([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = products
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (category) {
      result = result.filter((p) => p.category === category)
    }
    setFiltered(result)
  }, [search, category, products])

  useEffect(() => {
    setBundlesLoading(true);
    fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1") + "/bundles")
      .then(res => res.json())
      .then(setBundles)
      .catch(() => setBundles([]))
      .finally(() => setBundlesLoading(false));
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header/Navigation */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Image src="/genio logo dark.png" alt="Genio Logo" width={180} height={40} priority />
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-12 sm:py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-gray-200 text-base font-medium text-primary shadow-sm backdrop-blur-sm" style={{ fontWeight: 500 }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-primary"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI-powered assistants
              </span>
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Your Personal AI</span>
              <span className="block text-primary">Enhancement Suite</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover a curated collection of AI tools designed to enhance your focus, productivity, and personal growth.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col items-center gap-4 mt-2 mb-12">
          <div className="w-full max-w-xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSearch={() => {}}
              placeholder="Search collections, bundles, assistants..."
              className=""
            />
          </div>
          <div className="flex w-full max-w-xl gap-2 items-center">
            <CategoryDropdown
              categories={categories}
              selected={category}
              onSelect={setCategory}
              className="flex-1"
            />
            <RefreshButton onClick={fetchProducts} />
          </div>
        </div>

        {/* Bundles Grid */}
        <div className="py-6">
          {bundlesLoading ? (
            <div className="text-center text-gray-500 py-10">Loading bundles...</div>
          ) : bundles.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No bundles found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {bundles.map(bundle => (
                <div key={bundle.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out p-8 flex flex-col items-center justify-center text-center">
                  <Image src={bundle.image} alt={bundle.name || 'Bundle image'} width={320} height={192} unoptimized className="w-full h-48 object-cover rounded-xl mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{bundle.name}</h3>
                  <p className="text-gray-500">{bundle.description}</p>
                  {Array.isArray(bundle.products) && bundle.products.length > 0 && (
                    <ul className="mt-4 text-left w-full max-w-xs mx-auto list-disc list-inside text-gray-700">
                      {bundle.products.map((product: any) => (
                        <li key={product.id}>{product.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 rounded-3xl my-16">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Start your journey today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-gray-700">
              Join thousands of users who are already enhancing their mental capabilities with our AI tools.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:opacity-90 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 