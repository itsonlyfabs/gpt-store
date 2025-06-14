import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { marked } from 'marked'

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
      {/* Title and description at the top */}
      <div className="flex-none p-6 border-b bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{chatTitle}</h1>
        {chatDescription && (
          <div className="text-gray-500 text-sm mb-2">{chatDescription}</div>
        )}
      </div>

      {/* Chat input and send button just below the chat controls */}
      <div className="flex-none px-6 pt-6 pb-2 border-b bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isResponding}
          />
          <button
            type="submit"
            disabled={isResponding || !input.trim()}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white font-medium
              ${isResponding || !input.trim() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-600'
              }`}
          >
            {isResponding ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Chat messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          sortedMessages.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-2`}>
                <div className={`max-w-[70%] rounded-lg px-5 py-4 shadow-sm ${isAssistant ? 'bg-white text-gray-900 border border-gray-200' : 'bg-blue-500 text-white'} relative`}>
                  {/* Sender name */}
                  <div className={`font-semibold mb-1 ${msg.role === 'assistant' ? 'text-primary' : 'text-black'}`}>
                    {msg.role === 'assistant' ? (product?.name || session?.title || 'Assistant') : 'You'}
                  </div>
                  {/* Message content */}
                  {isAssistant ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-line" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                  ) : (
                    <div className="text-sm whitespace-pre-line">{msg.content}</div>
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

      {alertMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Alert</p>
          <p>{alertMessage}</p>
        </div>
      )}
    </div>
  )
} 