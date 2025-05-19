'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatProduct {
  id: string
  name: string
  description: string
  category: string
}

// Add a simple markdown-to-HTML converter for bold and paragraphs
function formatAssistantMessage(content: string | undefined | null) {
  if (!content) return '';
  // Replace **bold** with <strong>bold</strong>
  let html = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Split paragraphs by double newlines or single newlines, wrap in <p>
  html = html
    .split(/\n{2,}/)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('')
  return html
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [product, setProduct] = useState<ChatProduct | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchSessionAndMessages = async () => {
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        const accessToken = supaSession?.access_token;
        const res = await fetch(`/api/chat/${id}`, {
          headers: {
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setSession(data.session);
        setMessages(data.messages || []);
        // Fetch product info if not a bundle
        if (data.session && !data.session.is_bundle && data.session.product_id) {
          const prodRes = await fetch(`/api/products/${data.session.product_id}`)
          if (prodRes.ok) {
            const prodData = await prodRes.json()
            setProduct(prodData)
          }
        }
      } catch (error) {
        console.error('Error fetching chat session/messages:', error);
      }
    };
    if (id) {
      fetchSessionAndMessages();
    }
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input.trim(),
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      const res = await fetch(`/api/chat/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ content: input, role: 'user' })
      })
      const data = await res.json()
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating assistant response:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChat = async () => {
    if (!session) return
    setSaveLoading(true)
    setSaveSuccess(false)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      const res = await fetch(`/api/chat/session/${session.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ saved: true })
      })
      const data = await res.json()
      if (data.success) {
        setSaveSuccess(true)
      }
    } catch (error) {
      console.error('Error saving chat:', error)
    } finally {
      setSaveLoading(false)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const handleUnsaveChat = async () => {
    if (!session) return
    setSaveLoading(true)
    setSaveSuccess(false)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      const res = await fetch(`/api/chat/session/${session.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ saved: false })
      })
      const data = await res.json()
      if (data.success) {
        setSaveSuccess(true)
        // Optionally, update session state
        setSession((prev: any) => ({ ...prev, saved: false }))
      }
    } catch (error) {
      console.error('Error unsaving chat:', error)
    } finally {
      setSaveLoading(false)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const handleResetChat = async () => {
    if (!session) return
    if (!confirm('Are you sure you want to reset this chat? This will start a new conversation with the same assistant.')) return
    setLoading(true)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      // Create a new session with the same product_id
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ product_id: session.product_id })
      })
      const data = await res.json()
      if (data.session && data.session.id) {
        router.push(`/chat/${data.session.id}`)
      }
    } catch (error) {
      console.error('Error resetting chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!messages.length) return
    const text = messages.map(m => `[${m.sender}] ${m.content}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${session?.id || 'session'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadRecap = async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data: { session: supaSession } } = await supabase.auth.getSession()
      const accessToken = supaSession?.access_token
      const res = await fetch(`/api/chat/session/${session.id}/recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      })
      const data = await res.json()
      if (data.recap) {
        const blob = new Blob([data.recap], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-recap-${session.id}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading recap:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-center items-center h-full">
            <span>Loading chat...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Top bar with session info and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{product ? product.name : session.title || (session.is_bundle ? 'Bundle Chat' : 'Product Chat')}</h1>
              <div className="text-gray-500 text-sm">
                {product ? (
                  <span>{product.description}</span>
                ) : session.is_bundle ? (
                  <>
                    <span>Bundle ID: {session.bundle_id}</span>
                    <span className="ml-2">Assistants: {Array.isArray(session.assistant_ids) ? session.assistant_ids.join(', ') : 'N/A'}</span>
                  </>
                ) : (
                  <span>Product Chat</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChat}
                className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-60"
                disabled={saveLoading || session.saved}
              >
                {session.saved ? 'Saved' : saveLoading ? 'Saving...' : 'Save Chat'}
              </button>
              {session.saved && (
                <button
                  onClick={handleUnsaveChat}
                  className="px-4 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20"
                  disabled={saveLoading}
                >
                  Unsave
                </button>
              )}
              <button
                onClick={handleDownloadRecap}
                className="px-4 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20"
              >
                Download Recap
              </button>
              <button
                onClick={handleResetChat}
                className="px-4 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20"
              >
                Reset Chat
              </button>
              {saveSuccess && <span className="text-green-600 font-semibold ml-2">Saved!</span>}
            </div>
          </div>
          <div className="space-y-4 mb-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'assistant' ? (
                  <div
                    className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900 max-w-xl prose"
                    dangerouslySetInnerHTML={{ __html: formatAssistantMessage(msg.content) }}
                  />
                ) : (
                  <div className="rounded-lg px-4 py-2 bg-blue-500 text-white max-w-xl">{msg.content}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  )
} 