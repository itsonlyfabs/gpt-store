import React, { useState, useEffect, useRef } from 'react'
import { useChat, Message as UIMessage } from 'ai/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TeamGoalInput from './TeamGoalInput'
import NotesPanel from './NotesPanel'
import SummariesPanel from './SummariesPanel'
import Sidebar from './Sidebar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Product {
  id: string
  name: string
  description: string
  assistant_id: string
}

interface Note {
  id: string
  content: string
  created_at: string
}

interface Summary {
  id: string
  content: string
  created_at: string
}

interface TeamChatProps {
  toolId: string
  toolName: string
}

export default function TeamChat({ toolId, toolName }: TeamChatProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const [teamGoal, setTeamGoal] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [showNotes, setShowNotes] = useState(false)
  const [showSummaries, setShowSummaries] = useState(false)
  const [teamTitle, setTeamTitle] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')
  const [isBundle, setIsBundle] = useState(false)

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    setInput,
    reload,
    append,
  } = useChat({
    api: `/api/chat/${toolId}`,
    onError: (error) => setError(error.message),
  })

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return headers
  }

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/chat/${toolId}`, { headers })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setProducts(data.products || [])
        setActiveProductId(data.session?.active_product_id || null)
        setTeamGoal(data.session?.team_goal || '')
        setNotes(data.notes || [])
        setSummaries(data.summaries || [])
        setTeamTitle(data.session?.title || 'Team Chat')
        setTeamDescription(data.session?.description || '')
        setIsBundle(!!data.session?.is_bundle)
      } catch (error) {
        console.error('Error fetching session info:', error)
        setError('Failed to load session information')
      }
    }
    fetchSessionInfo()
  }, [toolId])

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/chat/${toolId}`, { headers })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (Array.isArray(data.messages)) {
          setChatHistory(data.messages)
        }
      } catch (error) {
        console.error('Error fetching chat history:', error)
        setError('Failed to load chat history')
      }
    }
    fetchChatHistory()
  }, [toolId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleUpdateTeamGoal = async (goal: string) => {
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch('/api/team-goal', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: toolId, team_goal: goal })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTeamGoal(goal)
      setEditingGoal(false)
    } catch (error) {
      console.error('Error updating team goal:', error)
      throw error
    }
  }

  const handleAddNote = async (content: string) => {
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: toolId, content })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNotes(prev => [...prev, data.note])
    } catch (error) {
      console.error('Error adding note:', error)
      throw error
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
        headers
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  const handleGenerateSummary = async () => {
    try {
      setLoading(true)
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: toolId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSummaries(prev => [...prev, data.summary])
    } catch (error) {
      console.error('Error generating summary:', error)
      setError('Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSummary = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/summaries?id=${id}`, {
        method: 'DELETE',
        headers
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSummaries(prev => prev.filter(summary => summary.id !== id))
    } catch (error) {
      console.error('Error deleting summary:', error)
      throw error
    }
  }

  const teamMembers = products.map((p) => p.name).join(', ')

  const getLastAssistantTimestamp = (messages: Message[] | undefined) => {
    const safeMessages = messages ?? [];
    const assistantMsgs = safeMessages.filter((m: Message) => m.role === 'assistant')
    const lastAssistant = assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1] : undefined;
    return lastAssistant && lastAssistant.created_at ? lastAssistant.created_at : null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || waitingForResponse) return;
    setWaitingForResponse(true);
    const userMsgContent = input;
    setInput('');
    if (isBundle) {
      let prevAssistantCount = chatHistory.filter(m => m.role === 'assistant').length;
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMsgContent,
        created_at: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, optimisticMsg]);
      try {
        const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
        await fetch(`/api/chat/${toolId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: userMsgContent, role: 'user' })
        });
        let foundNewAssistant = false;
        let pollCount = 0;
        while (!foundNewAssistant && pollCount < 15) {
          await new Promise(r => setTimeout(r, 1200));
          const historyRes = await fetch(`/api/chat/${toolId}`, { headers: await getAuthHeaders() });
          const historyData = await historyRes.json();
          if (Array.isArray(historyData.messages)) {
            const msgs = historyData.messages as Message[];
            setChatHistory(msgs);
            const assistantCount = msgs.filter((m: Message) => m.role === 'assistant').length;
            if (assistantCount > prevAssistantCount) foundNewAssistant = true;
          }
          pollCount++;
        }
      } catch (error: any) {
        setError(error.message || 'Failed to send message');
      } finally {
        setWaitingForResponse(false);
      }
    } else {
      try {
        const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
        await fetch(`/api/chat/${toolId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: userMsgContent, role: 'user' })
        });
        let foundNewAssistant = false;
        let pollCount = 0;
        while (!foundNewAssistant && pollCount < 15) {
          await new Promise(r => setTimeout(r, 1200));
          const historyRes = await fetch(`/api/chat/${toolId}`, { headers: await getAuthHeaders() });
          const historyData = await historyRes.json();
          if (Array.isArray(historyData.messages)) {
            const msgs = historyData.messages as Message[];
            setChatHistory(msgs);
            if (msgs.length > 0) {
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') foundNewAssistant = true;
            }
          }
          pollCount++;
        }
      } catch (error: any) {
        setError(error.message || 'Failed to send message');
      } finally {
        setWaitingForResponse(false);
      }
    }
  };

  const handleAskTeam = async () => {
    if (!input.trim() || isLoading || waitingForResponse || !isBundle) return;
    setWaitingForResponse(true);
    const userMsgContent = input;
    let prevAssistantCount = chatHistory.filter(m => m.role === 'assistant').length;
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsgContent,
      created_at: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, optimisticMsg]);
    setInput('');
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      await fetch('/api/ask-team', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: toolId, content: userMsgContent })
      });
      let foundNewAssistant = false;
      let pollCount = 0;
      while (!foundNewAssistant && pollCount < 15) {
        await new Promise(r => setTimeout(r, 1200));
        const historyRes = await fetch(`/api/chat/${toolId}`, { headers: await getAuthHeaders() });
        const historyData = await historyRes.json();
        if (Array.isArray(historyData.messages)) {
          const msgs = historyData.messages as Message[];
          setChatHistory(msgs);
          const assistantCount = msgs.filter((m: Message) => m.role === 'assistant').length;
          if (assistantCount > prevAssistantCount) foundNewAssistant = true;
        }
        pollCount++;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to ask the team');
    } finally {
      setWaitingForResponse(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{teamTitle}</h1>
          <div className="text-gray-500 text-sm mb-2">{teamDescription}</div>
          {isBundle && products.length > 0 && (
            <div className="mb-4">
              <span className="font-semibold text-gray-700 text-sm">Team members:</span>
              <span className="ml-2 text-gray-600 text-sm">{products.map((p) => p.name).join(', ')}</span>
            </div>
          )}
          {isBundle && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center w-full">
                <span className="font-semibold text-lg mr-2">Team Goal</span>
                {!editingGoal ? (
                  <>
                    <span className="text-gray-600 flex-1">{teamGoal || 'No team goal set'}</span>
                    <button
                      onClick={() => { setEditingGoal(true); setGoalDraft(teamGoal); }}
                      className="ml-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                      type="button"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      className="border rounded-lg px-2 py-1 flex-1 mr-2"
                      value={goalDraft}
                      onChange={e => setGoalDraft(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={async () => { await handleUpdateTeamGoal(goalDraft); }}
                      className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm mr-2"
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGoal(false)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm"
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-2 mb-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading || waitingForResponse}
            />
            {isBundle && (
              <button
                type="button"
                onClick={handleAskTeam}
                disabled={isLoading || waitingForResponse || !input.trim()}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
              >
                Ask Team
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || waitingForResponse || !input.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {chatHistory.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-4 py-2 max-w-xl ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {waitingForResponse && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col h-full">
          <div className="flex gap-0">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`px-4 py-2 bg-white border-l border-gray-200 hover:bg-gray-50 ${showNotes ? 'font-semibold border-b-2 border-primary' : ''}`}
            >
              Notes
            </button>
            <button
              onClick={() => setShowSummaries(!showSummaries)}
              className={`px-4 py-2 bg-white border-l border-gray-200 hover:bg-gray-50 ${showSummaries ? 'font-semibold border-b-2 border-primary' : ''}`}
            >
              Summaries
            </button>
          </div>
          {showNotes && (
            <NotesPanel
              notes={notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          )}
          {showSummaries && (
            <SummariesPanel
              summaries={summaries}
              onGenerateSummary={handleGenerateSummary}
              onDeleteSummary={handleDeleteSummary}
              isLoading={loading}
            />
          )}
        </div>
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </main>
    </div>
  )
} 