'use client'

import React, { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Review {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  product_id?: string
  bundle_id?: string
}

interface ReviewsProps {
  productId?: string
  bundleId?: string
  className?: string
}

export default function Reviews({ productId, bundleId, className = '' }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReviews()
  }, [productId, bundleId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError('')
      let url = '/api/reviews';
      const params = [];
      if (productId) params.push(`productId=${productId}`);
      if (bundleId) params.push(`bundleId=${bundleId}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError('Failed to load reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading reviews...</div>
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  if (!reviews.length) {
    return <div className="text-gray-500">No reviews yet</div>
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill={i < review.rating ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{review.reviewer_name}</span>
          </div>
          <p className="text-gray-600">{review.comment}</p>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
} 