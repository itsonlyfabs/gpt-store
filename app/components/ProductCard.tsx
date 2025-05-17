'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProductCardProps {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  tier: 'FREE' | 'PRO'
}

export default function ProductCard({
  id,
  name,
  description,
  category,
  thumbnail,
  tier,
}: ProductCardProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleViewDetails = async (e: React.MouseEvent) => {
    e.preventDefault()
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/product/${id}`)
  }

  const handleSignIn = () => {
    localStorage.setItem('redirectAfterLogin', `/product/${id}`)
    router.push('/auth/login')
  }

  const handleSignUp = () => {
    localStorage.setItem('redirectAfterLogin', `/product/${id}`)
    router.push('/auth/register')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 relative">
      <img
        src={thumbnail}
        alt={name}
        className="w-full h-48 object-cover"
      />
      <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>{tier}</span>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          <span className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
            {category}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex justify-end">
          <button
            onClick={handleViewDetails}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign up for free to unlock details!</h2>
            <p className="text-gray-600 mb-4">Create a free account to access product details and enjoy these benefits:</p>
            <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Access exclusive AI tools</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Save your favorites</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> Get personalized recommendations</li>
              <li className="flex items-center gap-2"><span className="text-primary">✓</span> 100% free, no credit card required</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignUp}
                className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Sign up for free
              </button>
              <button
                onClick={handleSignIn}
                className="w-full sm:w-auto px-6 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 