import React from 'react'
import { debounce } from 'lodash'

export interface PriceRange {
  min: number
  max: number
}

export type SubscriptionType = 'subscription' | 'one-time' | 'all'
export type SortBy = 'relevance' | 'price-asc' | 'price-desc' | 'newest'

export interface SearchFiltersProps {
  priceRange: PriceRange
  onPriceRangeChange: (range: PriceRange) => void
  subscriptionType: SubscriptionType
  onSubscriptionTypeChange: (type: SubscriptionType) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  className?: string
}

export default function SearchFilters({
  priceRange,
  onPriceRangeChange,
  subscriptionType,
  onSubscriptionTypeChange,
  sortBy,
  onSortChange,
  className = ''
}: SearchFiltersProps) {
  const handlePriceChange = debounce((min: number, max: number) => {
    onPriceRangeChange({ min: min * 100, max: max * 100 })
  }, 300)

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium mb-2">Price Range</h3>
        <div className="flex gap-4">
          <input
            type="number"
            value={priceRange.min / 100}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: Number(e.target.value) * 100 })}
            placeholder="Min"
            min="0"
            step="0.01"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
          />
          <span className="self-center">to</span>
          <input
            type="number"
            value={priceRange.max / 100}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: Number(e.target.value) * 100 })}
            placeholder="Max"
            min="0"
            step="0.01"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Subscription Type</h3>
        <select
          value={subscriptionType}
          onChange={(e) => onSubscriptionTypeChange(e.target.value as SubscriptionType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All</option>
          <option value="one-time">One-time</option>
          <option value="subscription">Subscription</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="relevance">Most Relevant</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>
  )
} 