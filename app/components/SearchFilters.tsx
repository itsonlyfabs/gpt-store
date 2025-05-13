'use client'

import React from 'react'

export type SubscriptionType = 'free' | 'pro' | 'all'
export type SortBy = 'relevance' | 'newest'

interface SearchFiltersProps {
  subscriptionType: SubscriptionType
  onSubscriptionTypeChange: (type: SubscriptionType) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  className?: string
}

export default function SearchFilters({
  subscriptionType,
  onSubscriptionTypeChange,
  sortBy,
  onSortChange,
  className = ''
}: SearchFiltersProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium mb-2">Subscription Type</h3>
        <select
          value={subscriptionType}
          onChange={(e) => onSubscriptionTypeChange(e.target.value as SubscriptionType)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        >
          <option value="all">All Subscription Types</option>
          <option value="free">FREE</option>
          <option value="pro">PRO</option>
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
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>
  )
} 