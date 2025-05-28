import React, { useState } from 'react'

interface Note {
  id: string
  content: string
  created_at: string
}

interface NotesPanelProps {
  notes: Note[]
  onAddNote: (content: string) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

export default function NotesPanel({ notes, onAddNote, onDeleteNote }: NotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || isLoading) return
    setIsLoading(true)
    try {
      await onAddNote(newNote.trim())
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Notes</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !newNote.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">
                {new Date(note.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-gray-500 text-center py-4">No notes yet</p>
        )}
      </div>
    </div>
  )
} 