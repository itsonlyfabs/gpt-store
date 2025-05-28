import React, { useState } from 'react'

interface TeamGoalInputProps {
  initialGoal: string
  onUpdate: (goal: string) => Promise<void>
  editButtonId?: string
}

export default function TeamGoalInput({ initialGoal, onUpdate, editButtonId }: TeamGoalInputProps) {
  const [goal, setGoal] = useState(initialGoal)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim() || isLoading) return
    setIsLoading(true)
    try {
      await onUpdate(goal.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating team goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Team Goal</h3>
          <button
            id={editButtonId}
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary hover:text-primary/80"
          >
            Edit
          </button>
        </div>
        <p className="mt-1 text-gray-600">{goal || 'No team goal set'}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Team Goal</h3>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Enter team goal..."
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !goal.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Goal'}
        </button>
      </div>
    </form>
  )
} 