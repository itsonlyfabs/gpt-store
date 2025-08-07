import React, { useState, useEffect, useRef } from 'react'
import { useChat, Message as UIMessage } from 'ai/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TeamGoalInput from './TeamGoalInput'
import NotesPanel from './NotesPanel'
import SummariesPanel from './SummariesPanel'
import Sidebar from './Sidebar'
import { marked } from 'marked'
import { ChevronDown, ChevronUp, Save, Download, RotateCcw, FileText, StickyNote, X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  product_id?: string
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
  toolDescription?: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

export default function TeamChat({ toolId, toolName, toolDescription }: TeamChatProps) {
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
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    setInput,
    reload,
    append,
  } = useChat({
    api: `${BACKEND_URL}/api/chat/${toolId}`,
    onError: (error) => setError(error.message),
  })

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return headers
  }

  async function fetchSessionInfo() {
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
      setTeamTitle((data.session?.title || toolName || '').trim())
      setTeamDescription((data.session?.description || toolDescription || '').trim())
      setIsBundle(!!data.session?.is_bundle)
      setSessionId(data.session?.id || null)
    } catch (error) {
      console.error('Error fetching session info:', error)
      setError('Failed to load session information')
    }
  }

  async function fetchChatHistory() {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/chat/${toolId}`, { headers })
      const data = await res.json()
      console.log('fetchChatHistory messages:', data.messages)
      if (data.error) throw new Error(data.error)
      if (Array.isArray(data.messages)) {
        setChatHistory(data.messages)
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
      setError('Failed to load chat history')
    }
  }

  useEffect(() => {
    fetchSessionInfo()
  }, [toolId])

  useEffect(() => {
    fetchChatHistory()
  }, [toolId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debug log for teamDescription
  useEffect(() => {
    console.log('teamDescription', teamDescription)
  }, [teamDescription])

  const handleUpdateTeamGoal = async (goal: string) => {
    if (!sessionId) return setError('No session ID')
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch(`/api/team-goal`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId, team_goal: goal })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTeamGoal(goal)
      setEditingGoal(false)
    } catch (error) {
      setError('Failed to update team goal')
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
    if (!sessionId) {
      setError('No session ID');
      console.error('No sessionId for summary generation');
      return;
    }
    try {
      setLoading(true)
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      console.log('Generating summary for sessionId:', sessionId);
      const res = await fetch(`/api/summaries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Use the id and created_at from the backend response if available
      const summaryObj = typeof data.summary === 'object' && data.summary !== null
        ? data.summary
        : { id: undefined, content: data.summary, created_at: new Date().toISOString() };
      setSummaries(prev => [...prev, summaryObj])
    } catch (error) {
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

  const handleReset = async () => {
    if (!sessionId) {
      setError('No session ID');
      console.error('No sessionId for reset');
      return;
    }
    if (window.confirm('Are you sure you want to reset the chat?')) {
      setLoading(true)
      setError(null)
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession()
        const accessToken = supaSession?.access_token
        console.log('Resetting chat for sessionId:', sessionId);
        await fetch(`/api/chat/${toolId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ reset: true, session_id: sessionId })
        })
        // Refetch session and chat history
        await fetchSessionInfo();
        await fetchChatHistory();
        setChatHistory([])
        setResetSuccess(true)
        setTimeout(() => setResetSuccess(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset chat')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveRecap = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      const res = await fetch(`/api/chat/session/${toolId}/recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          chat_history: chatHistory,
          team_title: teamTitle,
          team_description: teamDescription,
          is_bundle: isBundle
        })
      })
      const data = await res.json()
      if (data.success) {
        setError(null)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setError(data.error || 'Failed to save chat recap')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save chat recap')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      let recap = ''
      recap += `Bundle: ${teamTitle}\nDescription: ${teamDescription}\n\n`
      recap += chatHistory.map((msg) => `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`).join('\n')
      const blob = new Blob([recap], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bundle-chat-recap-${toolId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download recap')
    } finally {
      setLoading(false)
    }
  }

  const teamMembers = products.map((p) => p.name).join(', ')

  const getLastAssistantTimestamp = (messages: Message[] | undefined) => {
    const safeMessages = messages ?? []
    const assistantMsgs = safeMessages.filter((m: Message) => m.role === 'assistant')
    const lastAssistant = assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1] : undefined
    return lastAssistant && lastAssistant.created_at ? lastAssistant.created_at : null
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSendMessage called', { input, activeProductId, toolId, sessionId })
    if (!input.trim() || isLoading || waitingForResponse) return
    
    // For bundle chat, we need an active product
    if (isBundle && !activeProductId) {
      setError('Please select a product to chat with')
      return
    }

    setWaitingForResponse(true)
    const userMsgContent = input
    setInput('')

    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      
      // Add optimistic message
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMsgContent,
        created_at: new Date().toISOString(),
        product_id: activeProductId || undefined
      }
      setChatHistory(prev => [...prev, optimisticMsg])

      // Send message to backend
      const response = await fetch(`/api/chat/${toolId}`, {
          method: 'POST',
          headers,
        body: JSON.stringify({ 
          content: userMsgContent,
          product_id: activeProductId,
          is_bundle: isBundle
        })
        })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Poll for new messages
      let foundNewAssistant = false
      let pollCount = 0
      let lastAssistantId = null
      let lastAssistantCreatedAt = null
      if (chatHistory.length > 0) {
        const lastAssistant = [...chatHistory].reverse().find(m => m.role === 'assistant')
        lastAssistantId = lastAssistant?.id
        lastAssistantCreatedAt = lastAssistant?.created_at
      }
      while (!foundNewAssistant && pollCount < 15) {
        await new Promise(r => setTimeout(r, 1200))
        const historyRes = await fetch(`/api/chat/${toolId}`, { headers: await getAuthHeaders() })
        const historyData = await historyRes.json()
      
        if (Array.isArray(historyData.messages)) {
          const msgs = historyData.messages as Message[]
          setChatHistory(msgs)
          // Find the latest assistant message
          const newAssistant = [...msgs].reverse().find(m => m.role === 'assistant')
          if (newAssistant && (newAssistant.id !== lastAssistantId || newAssistant.created_at !== lastAssistantCreatedAt)) {
            foundNewAssistant = true
          }
        }
        pollCount++
      }

      if (!foundNewAssistant) {
        throw new Error('Timeout waiting for response')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send message')
      // Remove optimistic message on error
      setChatHistory(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`))
    } finally {
      setWaitingForResponse(false)
    }
  }

  const handleAskTeam = async () => {
    if (!input.trim()) return;
    setWaitingForResponse(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/ask-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ session_id: sessionId, content: input }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInput('');
      // After Ask Team, fetch the latest chat history from backend
      await fetchChatHistory();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get team response');
    } finally {
      setWaitingForResponse(false);
    }
  };

  function formatAssistantMessage(content: string | undefined | null) {
    if (!content) return '';
    
    // Check if this is a team response
    if (content.startsWith('Team Response Summary:')) {
      const [summary, individualResponses] = content.split('\n\nIndividual Team Member Responses:\n\n');
      
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-semibold text-lg mb-2">Team Response</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary ? summary.replace('Team Response Summary:', '').trim() : '') }} />
          </div>
          
          {individualResponses && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Individual Responses</h3>
              {individualResponses.split('\n--- ').map((response, index) => {
                if (!response.trim()) return null;
                const [name, ...contentParts] = response.split(' ---\n');
                const content = contentParts.join(' ---\n');
                
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{name}</h4>
                    <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    
    // Regular assistant message
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
  }

  function escapeHtml(text: string) {
    return text.replace(/[&<>'"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] || c;
    });
  }

  function renderBold(text: string) {
    // Escape HTML first, then replace **bold** with <strong>bold</strong>
    return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  function renderMarkdown(text: string) {
    return marked.parseInline(text);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8 pt-16 md:pt-8 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex-none border-b bg-white pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">{teamTitle}</h1>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showMobileMenu ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-gray-500 text-xs md:text-sm mb-2">{teamDescription || "No description set for this bundle."}</div>
        </div>

        {/* Mobile Collapsible Menu */}
        {showMobileMenu && (
          <div className="md:hidden mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveRecap}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Recap'}
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? 'Resetting...' : resetSuccess ? 'Reset!' : 'Reset'}
              </button>
              <button
                onClick={() => { setShowNotes(true); setShowSummaries(false); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
              >
                <StickyNote className="w-4 h-4" />
                Notes
              </button>
            </div>
            <button
              onClick={() => { setShowSummaries(true); setShowNotes(false); setShowMobileMenu(false); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
            >
              <FileText className="w-4 h-4" />
              Summaries
            </button>
          </div>
        )}

        {/* Desktop Action Buttons - Hidden on mobile */}
        {isBundle && (
          <div className="hidden md:flex gap-3 mb-4">
            <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={handleSaveRecap}
              disabled={loading}
            >
              {loading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Recap'}
            </button>
            <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={handleDownload}
              disabled={loading}
            >
              {loading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download'}
            </button>
            <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? 'Resetting...' : resetSuccess ? 'Reset!' : 'Reset'}
            </button>
          </div>
        )}

        {/* Products Section - Mobile Optimized */}
        {isBundle && (
          <div className="mb-4 flex-shrink-0">
            {products.length > 0 ? (
              <div className="space-y-2">
                <span className="font-semibold text-gray-700 text-sm">Active Product:</span>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        activeProductId === p.id 
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-400' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={async () => {
                        if (activeProductId !== p.id && sessionId) {
                          setLoading(true)
                          setError(null)
                          try {
                            const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
                            const res = await fetch(`/api/chat/switch-product`, {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({ sessionId, toProductId: p.id })
                            })
                            const data = await res.json()
                            if (data.error) throw new Error(data.error)
                            setActiveProductId(p.id)
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to switch product')
                          } finally {
                            setLoading(false)
                          }
                        }
                      }}
                      disabled={activeProductId === p.id || loading}
                    >
                      <span className="truncate max-w-32">{p.name}</span>
                      {activeProductId === p.id && <span className="ml-1">⭐</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-500 text-sm">No products found in this bundle.</div>
            )}
          </div>
        )}

        {/* Team Goal Section - Mobile Optimized */}
        {isBundle && (
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700 text-sm md:text-base">Team Goal</span>
              {!editingGoal && (
                <button
                  onClick={() => { setEditingGoal(true); setGoalDraft(teamGoal); }}
                  className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs md:text-sm"
                  type="button"
                >
                  Edit
                </button>
              )}
            </div>
            {!editingGoal ? (
              <div className="text-gray-600 text-sm md:text-base bg-gray-50 rounded-lg p-3">
                {teamGoal || 'No team goal set'}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm md:text-base"
                  value={goalDraft}
                  onChange={e => setGoalDraft(e.target.value)}
                  autoFocus
                  placeholder="Enter team goal..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => { await handleUpdateTeamGoal(goalDraft); }}
                    className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 text-xs md:text-sm"
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingGoal(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs md:text-sm"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Input - Mobile Optimized */}
        <form onSubmit={handleSendMessage} className="flex gap-2 mb-4 flex-shrink-0">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            disabled={isLoading || waitingForResponse}
          />
          {isBundle && (
            <button
              type="button"
              onClick={handleAskTeam}
              disabled={isLoading || waitingForResponse || !input.trim()}
              className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 text-sm md:text-base whitespace-nowrap"
            >
              Ask Team
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || waitingForResponse || !input.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm md:text-base"
          >
            Send
          </button>
        </form>

        {/* Chat Messages - Mobile Optimized with Proper Scrolling */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3 pb-4">
            {chatHistory.map(msg => {
              const isAskTeam = msg.role === 'assistant' && !msg.product_id;
              const product = msg.role === 'assistant' && msg.product_id ? products.find(p => p.id === msg.product_id) : null;
              const formatted = formatAssistantMessage(msg.content);
              return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-[85%] md:max-w-xl ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-gray-900'
                }`}>
                  {msg.role === 'assistant' ? (
                      <div>
                        {isAskTeam ? (
                          <div className="font-bold mb-1 text-indigo-700 text-sm">Team</div>
                        ) : product ? (
                          <div className="font-bold mb-1 text-indigo-700 text-sm">{product.name}</div>
                        ) : null}
                        {typeof formatted === 'string' ? (
                          <div
                            className="prose prose-sm max-w-none whitespace-pre-line text-sm"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(formatted) }}
                          />
                        ) : (
                          <div className="prose prose-sm max-w-none whitespace-pre-line text-sm">
                            {formatted}
                          </div>
                        )}
                      </div>
                  ) : (
                    <span className="text-sm">{msg.content}</span>
                  )}
                </div>
              </div>
              );
            })}
            <div ref={messagesEndRef} />
            {waitingForResponse && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Desktop Side Panels - Hidden on mobile */}
      <div className="hidden md:flex flex-col h-full">
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

      {/* Mobile Notes Popup Modal */}
      {showNotes && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Notes</h2>
              <button
                onClick={() => setShowNotes(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NotesPanel
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Summaries Popup Modal */}
      {showSummaries && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Summaries</h2>
              <button
                onClick={() => setShowSummaries(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SummariesPanel
                summaries={summaries}
                onGenerateSummary={handleGenerateSummary}
                onDeleteSummary={handleDeleteSummary}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
} 