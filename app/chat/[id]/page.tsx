'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const [bundle, setBundle] = useState<any>(null)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionOptions, setMentionOptions] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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
        // Fetch persistent chat history from backend
        if (Array.isArray(data.messages)) {
          // Map backend messages to frontend format
          const mapped = data.messages.map((msg: any) => ({
            id: msg.id,
            sender: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
            created_at: msg.created_at,
            product_id: msg.product_id,
            product_name: msg.product_name,
            nickname: msg.nickname,
          }))
          setMessages(mapped)
        } else {
          setMessages([])
        }
        // Fetch product info if not a bundle
        if (data.session && !data.session.is_bundle && data.session.product_id) {
          const prodRes = await fetch(`/api/products/${data.session.product_id}`)
          if (prodRes.ok) {
            const prodData = await prodRes.json()
            setProduct(prodData)
          }
        }
        // Fetch bundle info if bundle chat
        if (data.session && data.session.is_bundle && data.session.bundle_id) {
          const bundleRes = await fetch(`/api/bundles/${data.session.bundle_id}`)
          if (bundleRes.ok) {
            const bundleData = await bundleRes.json()
            // Fetch product details for mention autocomplete
            if (bundleData.product_ids && bundleData.product_ids.length > 0) {
              const prodsRes = await fetch(`/api/products?ids=${bundleData.product_ids.join(',')}`)
              if (prodsRes.ok) {
                const prodsData = await prodsRes.json()
                bundleData.products = prodsData
              }
            }
            setBundle(bundleData)
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

  useEffect(() => {
    // For bundle chats, build mention options from bundle products and nicknames
    if (session?.is_bundle && bundle && bundle.product_ids && bundle.products) {
      const options = bundle.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        nickname: bundle.assistant_nicknames?.[p.id] || null
      }))
      setMentionOptions(options)
    }
  }, [session, bundle])

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
      if (session?.is_bundle && Array.isArray(data.responses)) {
        // For bundle chats, append each assistant response with product/nickname
        const newMessages = data.responses.map((resp: any, idx: number) => ({
          id: `${Date.now() + idx + 1}`,
          sender: 'assistant',
          content: resp.content,
          created_at: new Date().toISOString(),
          product_id: resp.product_id,
          product_name: resp.product_name,
          nickname: resp.nickname,
        }))
        setMessages(prev => [...prev, ...newMessages])
      } else {
        // Single product chat (legacy)
        const assistantMessage = {
        id: (Date.now() + 1).toString(),
          sender: 'assistant',
        content: data.response,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
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

  // Handle input change for @mention autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    if (session?.is_bundle) {
      const cursor = e.target.selectionStart || 0
      const textBefore = value.slice(0, cursor)
      const match = textBefore.match(/@([\w-]*)$/)
      if (match) {
        setMentionQuery(match[1] || '')
        setShowMentionList(true)
      } else {
        setShowMentionList(false)
        setMentionQuery('')
      }
    }
  }

  // Insert mention at cursor
  const insertMention = useCallback((mention: string) => {
    if (!inputRef.current) return
    const cursor = inputRef.current.selectionStart || 0
    const value = input
    const textBefore = value.slice(0, cursor)
    const textAfter = value.slice(cursor)
    const match = textBefore.match(/@([\w-]*)$/)
    if (match) {
      const newText = textBefore.replace(/@([\w-]*)$/, `@${mention} `) + textAfter
      setInput(newText)
      setShowMentionList(false)
      setMentionQuery('')
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.selectionStart = inputRef.current.selectionEnd = (textBefore.replace(/@([\w-]*)$/, `@${mention} `)).length
        }
      }, 0)
    }
  }, [input])

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
              <h1 className="text-2xl font-bold mb-1">
                {session.is_bundle
                  ? (bundle ? bundle.name : 'Bundle Chat')
                  : (product ? product.name : session.title || 'Product Chat')}
              </h1>
              <div className="text-gray-500 text-sm">
                {session.is_bundle
                  ? (bundle ? bundle.description : <span>Bundle ID: {session.bundle_id}</span>)
                  : (product ? product.description : 'Product Chat')}
              </div>
              {/* Chat products line for bundle chats */}
              {session.is_bundle && bundle && (
                <div className="text-xs text-gray-500 mt-2 mb-2">
                  <span className="font-semibold text-gray-700">Chat products:</span> {' '}
                  {bundle.products && Array.isArray(bundle.products) && bundle.products.length > 0
                    ? bundle.products.map((p: any, idx: number) => (
                        <span key={p.id} className="inline-block mr-1">
                          {bundle.assistant_nicknames?.[p.id] || p.name}{idx < bundle.products.length - 1 ? ',' : ''}
                        </span>
                      ))
                    : <span className="italic text-gray-400">(none)</span>}
                </div>
              )}
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
                  <div className="max-w-xl">
                    {/* For bundle chats, show nickname or product name above the message */}
                    {session?.is_bundle && (msg.nickname || msg.product_name) && (
                      <div className="text-xs font-semibold text-primary mb-1">
                        {msg.nickname || msg.product_name}
                      </div>
                    )}
                    <div
                      className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900 prose"
                    dangerouslySetInnerHTML={{ __html: formatAssistantMessage(msg.content) }}
                  />
                  </div>
                ) : (
                  <div className="rounded-lg px-4 py-2 bg-blue-500 text-white max-w-xl">{msg.content}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              ref={inputRef}
              className="flex-1 border rounded px-3 py-2"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading || !input.trim()}>
              Send
            </button>
            {/* Mention dropdown */}
            {session?.is_bundle && showMentionList && mentionOptions.length > 0 && (
              <div className="absolute left-0 bottom-12 bg-white border rounded shadow-lg z-10 w-64 max-h-48 overflow-auto">
                {mentionOptions.filter(opt =>
                  (opt.nickname && opt.nickname.toLowerCase().includes(mentionQuery.toLowerCase())) ||
                  (opt.name && opt.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                ).map(opt => (
                  <div
                    key={opt.id}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onMouseDown={e => { e.preventDefault(); insertMention(opt.nickname || opt.name) }}
                  >
                    <span className="font-semibold">@{opt.nickname || opt.name}</span>
                    {opt.nickname && <span className="text-xs text-gray-500 ml-2">({opt.name})</span>}
                  </div>
                ))}
                {mentionOptions.filter(opt =>
                  (opt.nickname && opt.nickname.toLowerCase().includes(mentionQuery.toLowerCase())) ||
                  (opt.name && opt.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                ).length === 0 && (
                  <div className="px-3 py-2 text-gray-400">No matches</div>
                )}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  )
} 