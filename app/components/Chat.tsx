import { useEffect, useState, useRef } from 'react'
import { useChat, Message as UIMessage } from 'ai/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string // ISO date string
  alert?: string // Optional alert message
}

interface Product {
  id: string
  name: string
  assistant_id?: string
}

interface ChatProps {
  toolId: string
  toolName: string
}

export default function Chat({ toolId, toolName }: ChatProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Message[]>([])
  const [products, setProducts] = useState<Product[] | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    return headers
  }

  // Fetch session info (including products) on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/chat/${toolId}`, { headers })
        if (!response.ok) return
        const data = await response.json()
        if (data.products) setProducts(data.products)
      } catch {}
    }
    fetchSession()
  }, [toolId])

  // AI SDK chat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading: isResponding } = useChat({
    api: `/api/chat/${toolId}`,
    initialMessages: [],
    onResponse: (response: Response) => {
      if (!response.ok) {
        setError('Failed to send message')
        return
      }
      // Store message in history API
      const newMessage = {
        role: 'user' as const,
        content: input,
        createdAt: new Date().toISOString(),
        id: Math.random().toString(36).substring(7)
      }
      // Optionally: send with auth if needed
      getAuthHeaders().then(headers => {
        fetch('/api/chat/history', {
          method: 'POST', 
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: toolId,
            message: newMessage
          })
        }).catch(console.error)
      })
    }
  })

  // Fetch chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true)
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/chat/${toolId}`, { headers })
        if (!response.ok) throw new Error('Failed to fetch chat history')
        const data = await response.json()
        setHistory(data.messages || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat history')
        console.error('Chat history error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [toolId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Combine history with current messages
  const allMessages = [...history, ...messages]

  // Sort messages by createdAt
  const sortedMessages = [...messages].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  // Check for alert in the latest message
  const latestMessage = sortedMessages[sortedMessages.length - 1] as any
  const alertMessage = latestMessage?.alert

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex-none p-4 border-b">
        <h2 className="text-lg font-semibold">{toolName}</h2>
        {products && products.length > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            <b>Chat products:</b> {products.map(p => p.name).join(', ')}
          </div>
        )}
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : allMessages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          sortedMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'} mb-4`}>
              <div className={`max-w-[70%] rounded-lg p-4 ${message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                <p className="text-sm">{message.content}</p>
                {message.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {alertMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Alert</p>
          <p>{alertMessage}</p>
        </div>
      )}

      <form 
        onSubmit={handleSubmit}
        className="flex-none p-4 border-t"
      >
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
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
        </div>
      </form>
    </div>
  )
} 