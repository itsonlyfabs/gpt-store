import React from 'react';

interface RefreshButtonProps {
  onClick: () => void;
  className?: string;
}

export default function RefreshButton({ onClick, className = '' }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label="Refresh"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 19.5A9 9 0 1112 21v-3m0 0l-3 3m3-3l3 3"
        />
      </svg>
    </button>
  );
} 