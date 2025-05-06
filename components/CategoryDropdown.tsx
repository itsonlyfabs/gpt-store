import React from 'react';

interface CategoryDropdownProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  className?: string;
}

export default function CategoryDropdown({ categories, selected, onSelect, className = '' }: CategoryDropdownProps) {
  return (
    <select
      value={selected}
      onChange={e => onSelect(e.target.value)}
      className={`w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">All Categories</option>
      {categories.map(category => (
        <option key={category} value={category}>{category}</option>
      ))}
    </select>
  );
} 