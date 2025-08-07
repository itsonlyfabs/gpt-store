import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { marked } from 'marked'
import { ChevronDown, ChevronUp, Save, Download, RotateCcw, FileText, StickyNote, X } from 'lucide-react'
import NotesPanel from './NotesPanel'
import SummariesPanel from './SummariesPanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string // ISO date string
  alert?: string // Optional alert message
  product_id?: string
}

interface Product {
  id: string
  name: string
  assistant_id?: string
  description?: string
}

interface ChatProps {
  toolId: string
  toolName: string
  toolDescription?: string
}

export default function Chat({ toolId, toolName, toolDescription }: ChatProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Message[]>([])
  const [session, setSession] = useState<any>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [input, setInput] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [showNotes, setShowNotes] = useState(false)
  const [showSummaries, setShowSummaries] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return headers
  }

  // Fetch session info (including product_id) on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/chat/${toolId}`, { headers })
        if (!response.ok) return
        const data = await response.json()
        if (data.session) setSession(data.session)
        setHistory((data.messages || []).map((m: any) => ({
          ...m,
          createdAt: m.created_at || m.createdAt,
          role: (m.role || '').toLowerCase()
        })))
        // Set notes and summaries
        setNotes(data.notes || [])
        setSummaries(data.summaries || [])
        // Fetch product if product_id exists
        if (data.session?.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('id, name, description')
            .eq('id', data.session.product_id)
            .single()
          if (prod) setProduct(prod)
        }
      } catch {}
      setIsLoading(false)
    }
    fetchSession()
  }, [toolId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [history])

  // Custom send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setIsResponding(true)
    setError(null)
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const response = await fetch(`/api/chat/${toolId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: input })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to send message')
        setIsResponding(false)
        return
      }
      // Refetch chat history after sending
      const historyRes = await fetch(`/api/chat/${toolId}`, { headers: await getAuthHeaders() })
      const historyData = await historyRes.json()
      setHistory(historyData.messages || [])
      setInput('')
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setIsResponding(false)
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
        }
      })
      const data = await res.json()
      if (data.success) {
        setError(null)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setError(data.error || 'Failed to save chat recap')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save chat recap')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      let recap = ''
      if (product) {
        recap += `Product: ${product.name}\nDescription: ${product.description}\n\n`
      }
      recap += history.map((msg) => `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`).join('\n')
      const blob = new Blob([recap], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-recap-${toolId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to download recap')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the chat?')) {
      setLoading(true)
      setError(null)
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession()
        const accessToken = supaSession?.access_token
        await fetch(`/api/chat/${toolId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ reset: true })
        })
        setHistory([])
        setResetSuccess(true)
        setTimeout(() => setResetSuccess(false), 2000)
      } catch (err: any) {
        setError(err.message || 'Failed to reset chat')
      } finally {
        setLoading(false)
      }
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
      const res = await fetch(`/api/summaries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: toolId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
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

  // Sort messages by createdAt
  const sortedMessages = Array.isArray(history)
    ? [...history].sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
    : [];

  // Check for alert in the latest message
  const latestMessage = Array.isArray(sortedMessages) && sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1] : {};
  const alertMessage = (latestMessage as any)?.alert;

  // Helper to render markdown for assistant messages
  function renderMarkdown(text: string) {
    return { __html: marked.parseInline(text) };
  }

  // Get chat title and description
  const chatTitle = session?.title || product?.name || toolName || 'Assistant';
  const chatDescription = product?.description || toolDescription || '';

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Mobile Header - More Compact */}
      <div className="flex-none border-b bg-white pb-2 md:pb-4 mb-2 md:mb-4">
        <div className="flex items-center justify-between mb-1 md:mb-2 p-2 md:p-6">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900 truncate">{chatTitle}</h1>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            {showMobileMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {chatDescription && (
          <div className="text-gray-500 text-xs md:text-sm mb-1 md:mb-2 px-2 md:px-6 line-clamp-1">{chatDescription}</div>
        )}
      </div>

      {/* Mobile Collapsible Menu - More Compact */}
      {showMobileMenu && (
        <div className="md:hidden mb-2 bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-2 mx-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveRecap}
              disabled={loading}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs"
            >
              <Save className="w-3 h-3" />
              {loading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Recap'}
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs"
            >
              <Download className="w-3 h-3" />
              {loading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              {loading ? 'Resetting...' : resetSuccess ? 'Reset!' : 'Reset'}
            </button>
            <button
              onClick={() => { setShowNotes(true); setShowSummaries(false); setShowMobileMenu(false); }}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
            >
              <StickyNote className="w-3 h-3" />
              Notes
            </button>
          </div>
          <button
            onClick={() => { setShowSummaries(true); setShowNotes(false); setShowMobileMenu(false); }}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
          >
            <FileText className="w-3 h-3" />
            Summaries
          </button>
        </div>
      )}

      {/* Desktop Action Buttons - Hidden on mobile */}
      <div className="hidden md:flex gap-3 mb-4 px-6">
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

      {/* Chat input and send button - More Compact on Mobile */}
      <div className="flex-none px-2 md:px-6 pt-2 md:pt-6 pb-2 border-b bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-base"
            disabled={isResponding}
          />
          <button
            type="submit"
            disabled={isResponding || !input.trim()}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-500 text-white font-medium text-xs md:text-base
              ${isResponding || !input.trim() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-600'
              }`}
          >
            {isResponding ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Chat messages area - Now Gets Proper Space */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 mx-2 md:mx-6 my-2 md:my-4"
      >
        <div className="p-2 md:p-6 space-y-2 md:space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center text-sm">{error}</div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Start your conversation by typing a message below
            </div>
          ) : (
            sortedMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-2`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-lg px-2 py-1.5 md:px-5 md:py-4 shadow-sm ${
                    isAssistant ? 'bg-gray-100 text-gray-900' : 'bg-blue-500 text-white'
                  } relative`}>
                    {/* Sender name */}
                    <div className={`font-semibold mb-1 text-xs md:text-sm ${msg.role === 'assistant' ? 'text-primary' : 'text-black'}`}>
                      {msg.role === 'assistant' ? (product?.name || session?.title || 'Assistant') : 'You'}
                    </div>
                    {/* Message content */}
                    {isAssistant ? (
                      <div className="prose prose-sm max-w-none whitespace-pre-line text-xs md:text-sm" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                    ) : (
                      <div className="text-xs md:text-sm whitespace-pre-line">{msg.content}</div>
                    )}
                    {/* Timestamp */}
                    {typeof msg.createdAt === 'string' && msg.createdAt && (
                      <div className="text-xs text-gray-400 mt-2 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {alertMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-2 md:mx-6" role="alert">
          <p className="font-bold text-sm">Alert</p>
          <p className="text-sm">{alertMessage}</p>
        </div>
      )}

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