'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TeamChat from '@/components/TeamChat'
import Chat from '@/components/Chat'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

interface ChatProduct {
  id: string
  name: string
  description: string
  category: string
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
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [product, setProduct] = useState<ChatProduct | null>(null)
  const [bundle, setBundle] = useState<any>(null)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionOptions, setMentionOptions] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [checkingBundle, setCheckingBundle] = useState(true)
  const [productInfo, setProductInfo] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        const accessToken = supaSession?.access_token;
        const res = await fetch(`/api/chat/${id}`, {
          headers: {
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        });
        const data = await res.json();
        if (data.session && data.session.is_bundle) {
          setSession(data.session)
          setCheckingBundle(false)
        } else {
          setSession(data.session)
          setCheckingBundle(false)
        }
        // Set product info for single product chat
        if (data.products && data.products[0]) {
          setProductInfo(data.products[0]);
        }
        // Set chat messages for persistency
        if (Array.isArray(data.messages)) {
          setMessages(data.messages.map((msg: any) => ({
            sender: (msg.role || '').toLowerCase(),
            content: msg.content
          })));
        }
      } catch {
        setCheckingBundle(false)
      }
    }
    fetchSession()
  }, [id, supabase])

  if (checkingBundle) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
            <span>Loading chat...</span>
        </main>
      </div>
    )
  }

  if (session?.is_bundle) {
    return <TeamChat toolId={id as string} toolName="Team Chat" />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-start p-0">
        <div className="w-full max-w-2xl mx-auto px-6 pt-10">
          {productInfo && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{productInfo.name}</h1>
              <div className="text-gray-500 text-sm mb-2">{productInfo.description}</div>
            </>
          )}
          <div className="flex gap-3 mb-6">
              <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={async () => {
                setSaveLoading(true)
                setSaveError(null)
                try {
                  const { data: { session: supaSession } } = await supabase.auth.getSession();
                  const accessToken = supaSession?.access_token;
                  const res = await fetch(`/api/chat/session/${id}/save`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                    }
                  })
                  const data = await res.json()
                  if (data.success) {
                    // Debug: fetch session and check saved
                    const sessionRes = await fetch(`/api/chat/${id}`, {
                      headers: {
                        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                      }
                    })
                    const sessionData = await sessionRes.json()
                    console.log('Session after save:', sessionData.session)
                    if (sessionData.session && sessionData.session.saved) {
                      setSaveSuccess(true)
                      setTimeout(() => setSaveSuccess(false), 2000)
                    } else {
                      setSaveError('Save did not persist. Session not marked as saved.')
                    }
                  } else {
                    setSaveError(data.error || 'Failed to save chat')
                  }
                } catch (err: any) {
                  setSaveError(err.message || 'Failed to save chat')
                } finally {
                  setSaveLoading(false)
                }
              }}
                  disabled={saveLoading}
                >
              {saveLoading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
                </button>
              <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={async () => {
                setDownloadLoading(true)
                setDownloadError(null)
                try {
                  let recap = ''
                  if (productInfo) {
                    recap += `Product: ${productInfo.name}\nDescription: ${productInfo.description}\n\n`
                  }
                  recap += messages.map((msg, i) => `${msg.sender === 'user' ? 'You' : 'Assistant'}: ${msg.content}`).join('\n')
                  const blob = new Blob([recap], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `chat-recap-${id}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  setDownloadSuccess(true)
                  setTimeout(() => setDownloadSuccess(false), 2000)
                } catch (err: any) {
                  setDownloadError(err.message || 'Failed to download recap')
                } finally {
                  setDownloadLoading(false)
                }
              }}
              disabled={downloadLoading}
            >
              {downloadLoading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download'}
              </button>
              <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={async () => {
                if (confirm('Are you sure you want to reset the chat?')) {
                  setMessages([])
                  const { data: { session: supaSession } } = await supabase.auth.getSession();
                  const accessToken = supaSession?.access_token;
                  await fetch(`/api/chat/${id}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                    },
                    body: JSON.stringify({ reset: true })
                  })
                }
              }}
            >
              Reset
              </button>
          </div>
          {saveError && <div className="text-red-500 text-sm mt-2">{saveError}</div>}
          {downloadError && <div className="text-red-500 text-sm mt-2">{downloadError}</div>}
          <div className="flex items-center w-full mb-6">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim()) {
                    const userMsg = { sender: 'user', content: input };
                    setMessages(prev => [...prev, userMsg])
                    setInput('')
                    setLoading(true)
                    const { data: { session: supaSession } } = await supabase.auth.getSession();
                    const accessToken = supaSession?.access_token;
                    // Send user message and get assistant reply
                    const postRes = await fetch(`/api/chat/${id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                      },
                      body: JSON.stringify({ content: input, role: 'user' })
                    })
                    const postData = await postRes.json();
                    if (postData.response) {
                      setMessages(prev => [...prev, { sender: 'assistant', content: postData.response }])
                    }
                    setLoading(false)
                  }
                }
              }}
              placeholder="Type your message..."
              className="flex-1 p-3 border rounded text-lg"
            />
            <button
              onClick={async () => {
                if (input.trim()) {
                  const userMsg = { sender: 'user', content: input };
                  setMessages(prev => [...prev, userMsg])
                  setInput('')
                  setLoading(true)
                  const { data: { session: supaSession } } = await supabase.auth.getSession();
                  const accessToken = supaSession?.access_token;
                  // Send user message and get assistant reply
                  const postRes = await fetch(`/api/chat/${id}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                    },
                    body: JSON.stringify({ content: input, role: 'user' })
                  })
                  const postData = await postRes.json();
                  if (postData.response) {
                    setMessages(prev => [...prev, { sender: 'assistant', content: postData.response }])
                  }
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="ml-3 px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary-dark transition disabled:opacity-50 text-lg"
            >
              <span>Send</span>
            </button>
          </div>
          <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto" ref={messagesEndRef}>
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center mt-8">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] break-words shadow-sm
                      ${msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200'}
                    `}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="text-xs text-gray-500 mb-1 font-semibold">Assistant</div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: formatAssistantMessage(msg.content) }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 