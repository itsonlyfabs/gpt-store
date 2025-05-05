'use client'

import React, { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { supabase } from 'app/utils/supabase'

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
}

interface ReviewsProps {
  productId: string
  className?: string
}

export default function Reviews({ productId, className = '' }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError('')

      // In development mode, use mock data
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
        
        const mockReviews: Review[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            rating: 5,
            comment: 'This AI tool has significantly improved my focus during work sessions.',
            date: '2024-01-15'
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Jane Smith',
            rating: 4,
            comment: 'Very helpful for maintaining concentration, though there is room for improvement.',
            date: '2024-01-10'
          }
        ]
        
        setReviews(mockReviews)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('productId', productId)
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
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

  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-4">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill={i < review.rating ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{review.userName}</span>
          </div>
          <p className="text-gray-600">{review.comment}</p>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(review.date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
} 