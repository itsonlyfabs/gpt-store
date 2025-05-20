'use client'

import React from 'react'

export type SortBy = 'relevance' | 'newest' | 'price-asc' | 'price-desc'

interface SearchFiltersProps {
  sortBy: string
  onSortChange: (sort: string) => void
  className?: string
}

export default function SearchFilters({
  sortBy,
  onSortChange,
  className = ''
}: SearchFiltersProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium mb-2">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="relevance">Most Relevant</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>
  )
} 