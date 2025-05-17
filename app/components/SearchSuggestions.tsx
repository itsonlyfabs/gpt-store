'use client'

import React, { useEffect, useState } from 'react'

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
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    console.log('Fetching suggestions for query:', query);
    // Fetch product and bundle titles from backend
    const fetchSuggestions = async () => {
      try {
        const [productsRes, bundlesRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/bundles?search=${encodeURIComponent(query)}&limit=5`)
        ]);
        const products = productsRes.ok ? await productsRes.json() : [];
        const bundles = bundlesRes.ok ? await bundlesRes.json() : [];
        const productTitles = products.map((p: any) => p.name);
        const bundleTitles = bundles.map((b: any) => b.name);
        setSuggestions([...productTitles, ...bundleTitles]);
      } catch {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [query]);

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