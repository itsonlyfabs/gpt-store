'use client'

import React from 'react'

interface SearchSuggestionsProps {
  query: string
  onSuggestionClick: (suggestion: string) => void
  className?: string
}

export default function SearchSuggestions({ 
  query, 
  onSuggestionClick,
  className = '' 
}: SearchSuggestionsProps) {
  // Mock suggestions based on query
  const suggestions = [
    `${query} AI assistant`,
    `${query} productivity tool`,
    `${query} automation`,
    `${query} helper`
  ].filter(suggestion => suggestion !== query)

  if (!query || suggestions.length === 0) {
    return null
  }

  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  )
} 