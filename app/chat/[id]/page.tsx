'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { supabase } from 'app/utils/supabase'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ChatProduct | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) throw new Error('Product not found')
        const prod = await res.json()
        setProduct(prod)
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }
    const fetchChatHistory = async () => {
      try {
        // Get Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        const res = await fetch(`http://localhost:3000/api/chat/${id}/history`, {
          headers: {
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        })
        if (!res.ok) throw new Error('Failed to fetch chat history')
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (error) {
        console.error('Error fetching chat history:', error)
      }
    }
    if (id) {
      fetchProduct()
      fetchChatHistory()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Send message to backend with Authorization header
      const res = await fetch(`http://localhost:3000/api/chat/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ message: input })
      })
      const data = await res.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating assistant response:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-center items-center h-full">
            <span>Loading product...</span>
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
          <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>
          <div className="space-y-4 mb-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
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