import React from 'react'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  category: string
  thumbnail: string
  priceType?: 'one_time' | 'subscription'
  currency?: string
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  category,
  thumbnail,
  priceType = 'one_time',
  currency = 'USD',
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <img
        src={thumbnail}
        alt={name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
            {category}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
              }).format(price / 100)}
            </span>
            <span className="text-gray-500 text-sm ml-1">
              {priceType === 'subscription' ? '/month' : ''}
            </span>
          </div>
          <Link
            href={`/product/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
} 