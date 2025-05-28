import React, { useState } from 'react'

interface Summary {
  id: string
  content: string
  created_at: string
}

interface SummariesPanelProps {
  summaries: Summary[]
  onGenerateSummary: () => Promise<void>
  onDeleteSummary: (id: string) => Promise<void>
  isLoading: boolean
}

export default function SummariesPanel({
  summaries,
  onGenerateSummary,
  onDeleteSummary,
  isLoading
}: SummariesPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Summaries</h2>
        <button
          onClick={onGenerateSummary}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      <div className="space-y-4">
        {summaries.map((summary) => (
          <div key={summary.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">
                {new Date(summary.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => onDeleteSummary(summary.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{summary.content}</p>
          </div>
        ))}
        {summaries.length === 0 && (
          <p className="text-gray-500 text-center py-4">No summaries yet</p>
        )}
      </div>
    </div>
  )
} 