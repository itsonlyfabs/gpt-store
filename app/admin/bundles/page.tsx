'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import type { Product } from '../../types/product'

interface Bundle {
  id: string
  name: string
  description: string
  image: string
  tier: string
  is_admin: boolean
  products: Product[]
  productsCount: number
  category: string
  is_signature_collection: boolean
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const categories = [
    'Personal Development',
    'NLP Mindset Work',
    'Emotional Mastery',
    'Business & Productivity',
    'Life Clarity & Purpose',
    'Wellness & Self-Care',
    'Learning & Growth',
    'Communication & Relationships',
    'Signature Collection',
  ];
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bundles?admin=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }
      const data = await response.json()
      // Map categories to category if needed
      const mapped = (data as any[]).map((bundle: any) => ({
        ...bundle,
        category: bundle.category || bundle.categories || '-',
      }))
      setBundles(mapped)
    } catch (err) {
      console.error('Error fetching bundles:', err)
      setError('Failed to load bundles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBundle = () => {
    router.push('/admin/bundles/create')
  }

  const handleEditBundle = (bundleId: string) => {
    router.push(`/admin/bundles/edit/${bundleId}`)
  }

  const handleDeleteBundle = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) {
      return
    }

    try {
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete bundle')
      }

      // Remove the deleted bundle from the state
      setBundles(bundles.filter(bundle => bundle.id !== bundleId))
    } catch (err) {
      console.error('Error deleting bundle:', err)
      setError('Failed to delete bundle')
    }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Bundles</h1>
          <button
            onClick={handleCreateBundle}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FiPlus className="mr-2" />
            Create Bundle
          </button>
        </div>

        {/* Category filter dropdown */}
        <div className="mb-6 flex gap-2 items-center">
          <label className="font-medium text-gray-700">Filter by Category:</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 font-bold border-b pb-2 mb-4 text-gray-700">
          <div>Name</div>
          <div>Description</div>
          <div>Category</div>
          <div>Products</div>
          <div>Tier</div>
          <div>Actions</div>
        </div>
        {/* Table rows */}
        {loading ? (
          <div>Loading...</div>
        ) : (
          bundles
            .filter(bundle => {
              if (!selectedCategory) return true;
              if (selectedCategory === 'Signature Collection') {
                return bundle.is_signature_collection;
              }
              return bundle.category === selectedCategory;
            })
            .map((bundle) => (
              <div key={bundle.id} className="grid grid-cols-6 gap-4 items-center border-b py-4">
                <div className="font-medium">{bundle.name}</div>
                <div className="text-gray-600">{bundle.description}</div>
                <div className="text-gray-600">{bundle.is_signature_collection ? 'Signature Collection' : (bundle.category || '-')}</div>
                <div className="text-gray-600">{typeof bundle.productsCount === 'number' ? `${bundle.productsCount} products` : (bundle.products?.length || 0) + ' products'}</div>
                <div className="text-gray-600">{bundle.tier}</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditBundle(bundle.id)} 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteBundle(bundle.id)} 
                    className="text-red-600 hover:text-red-800 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
} 