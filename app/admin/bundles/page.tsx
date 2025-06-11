'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'

interface Bundle {
  id: string
  name: string
  description: string
  image: string
  tier: string
  is_admin: boolean
  products: any[]
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bundles?admin=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }
      const data = await response.json()
      setBundles(data)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bundles/${bundleId}`, {
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
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      bundle.tier === 'PRO' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {bundle.tier}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {bundle.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {bundle.description}
                  </p>
                  {Array.isArray(bundle.products) && bundle.products.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bundle.products.map((product: any) => (
                        <span key={product.id} className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          {product.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditBundle(bundle.id)}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                      title="Edit bundle"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteBundle(bundle.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete bundle"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 