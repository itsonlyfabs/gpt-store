import React from 'react'
import { useEffect, useState } from 'react'

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    // Mock suggestions based on query
    // In a real app, this would be an API call
    const mockSuggestions = [
      'AI chatbot',
      'AI image generator',
      'AI writing assistant',
      'AI code generator',
      'AI video editor'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()))

    setSuggestions(mockSuggestions)
  }, [query])

  const handleSuggestionClick = (suggestion: string) => {
    // Add to history
    const newHistory = [suggestion, ...history.filter(h => h !== suggestion)].slice(0, 5)
    setHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    
    onSuggestionClick(suggestion)
  }

  if (!query && !history.length) return null

  return (
    <div className={`bg-white rounded-lg shadow-lg p-2 ${className}`}>
      {query && suggestions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 mb-2 px-2">Suggestions</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!query && history.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Searches</h3>
          <ul>
            {history.map((item, index) => (
              <li key={index} className="flex items-center justify-between">
                <button
                  className="flex-grow text-left px-4 py-2 hover:bg-gray-100 rounded-md text-sm"
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item}
                </button>
                <button
                  className="px-2 py-2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    const newHistory = history.filter((_, i) => i !== index)
                    setHistory(newHistory)
                    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 