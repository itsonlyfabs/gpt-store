'use client'

import React from 'react'
import Link from 'next/link'

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
          <Link
            href={`/product/${id}`}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
} 