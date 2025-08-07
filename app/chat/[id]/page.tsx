'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TeamChat from '@/components/TeamChat'
import Chat from '@/components/Chat'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NotesPanel from '@/components/NotesPanel'
import SummariesPanel from '@/components/SummariesPanel'

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
  const params = useParams() as Record<string, string>;
  const id = params.id;
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
  const [notes, setNotes] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [showNotes, setShowNotes] = useState(false)
  const [showSummaries, setShowSummaries] = useState(false)
  const [summariesLoading, setSummariesLoading] = useState(false)
  const [resetCount, setResetCount] = useState(0)
  const [resetSuccess, setResetSuccess] = useState(false)

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
          // Set bundle info for TeamChat from data.bundle
          if (data.bundle) {
            setBundle({
              id: data.bundle.id,
              name: data.bundle.name,
              description: data.bundle.description
            });
          }
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
        // Set notes and summaries
        setNotes(data.notes || [])
        setSummaries(data.summaries || [])
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
    return <TeamChat toolId={id as string} toolName={bundle?.name || 'Team Chat'} toolDescription={bundle?.description || ''} />
  }

  // Restore full product chat UI
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-start p-0 relative">
        <div className="absolute top-0 right-0 mt-10 mr-10 z-20 md:z-20 z-30">
          <div className="flex gap-0">
            <button
              onClick={() => { setShowNotes(!showNotes); setShowSummaries(false); }}
              className={`px-4 py-2 bg-white border-l border-gray-200 hover:bg-gray-50 ${showNotes ? 'font-semibold border-b-2 border-primary' : ''}`}
            >
              Notes
            </button>
            <button
              onClick={() => { setShowSummaries(!showSummaries); setShowNotes(false); }}
              className={`px-4 py-2 bg-white border-l border-gray-200 hover:bg-gray-50 ${showSummaries ? 'font-semibold border-b-2 border-primary' : ''}`}
            >
              Summaries
            </button>
          </div>
          {showNotes && (
            <NotesPanel
              notes={notes}
              onAddNote={async (content: string) => {
                // Add note logic
                const { data: { session: supaSession } } = await supabase.auth.getSession();
                const accessToken = supaSession?.access_token;
                const res = await fetch('/api/notes', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                  },
                  body: JSON.stringify({ session_id: id, content })
                })
                const data = await res.json()
                if (data.note) setNotes((prev: any[]) => [...prev, data.note])
              }}
              onDeleteNote={async (noteId: string) => {
                // Delete note logic
                const { data: { session: supaSession } } = await supabase.auth.getSession();
                const accessToken = supaSession?.access_token;
                await fetch(`/api/notes?id=${noteId}`, {
                  method: 'DELETE',
                  headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                  }
                })
                setNotes((prev: any[]) => prev.filter((n) => n.id !== noteId))
              }}
            />
          )}
          {showSummaries && (
            <SummariesPanel
              summaries={summaries}
              onGenerateSummary={async () => {
                setSummariesLoading(true)
                const { data: { session: supaSession } } = await supabase.auth.getSession();
                const accessToken = supaSession?.access_token;
                const res = await fetch('/api/summaries', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                  },
                  body: JSON.stringify({ session_id: id })
                })
                const data = await res.json()
                if (data.summary) setSummaries((prev: any[]) => [data.summary, ...prev])
                setSummariesLoading(false)
              }}
              onDeleteSummary={async (summaryId: string) => {
                const { data: { session: supaSession } } = await supabase.auth.getSession();
                const accessToken = supaSession?.access_token;
                await fetch(`/api/summaries?id=${summaryId}`, {
                  method: 'DELETE',
                  headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                  }
                })
                setSummaries((prev: any[]) => prev.filter((s) => s.id !== summaryId))
              }}
              isLoading={summariesLoading}
            />
          )}
        </div>
        <div className="w-full max-w-2xl mx-auto px-6 pt-20 md:pt-10">
          <div className="flex gap-3 mb-6">
              <button
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
              onClick={async () => {
                setSaveLoading(true)
                setSaveError(null)
                try {
                  const { data: { session: supaSession } } = await supabase.auth.getSession();
                  const accessToken = supaSession?.access_token;
                  const res = await fetch(`/api/chat/session/${id}/recap`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                    }
                  })
                  const data = await res.json()
                  if (data.success) {
                    setSaveSuccess(true)
                    setTimeout(() => setSaveSuccess(false), 2000)
                    // Redirect to the recap page
                    router.push(`/chat/recap/${id}`)
                  } else {
                    setSaveError(data.error || 'Failed to save chat recap')
                  }
                } catch (err: any) {
                  setSaveError(err.message || 'Failed to save chat recap')
                } finally {
                  setSaveLoading(false)
                }
              }}
                  disabled={saveLoading}
                >
              {saveLoading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Recap'}
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
                  setResetSuccess(true)
                  setResetCount(c => c + 1)
                  setTimeout(() => setResetSuccess(false), 2000)
                }
              }}
            >
              Reset
              </button>
          </div>
          {saveError && <div className="text-red-500 text-sm mt-2">{saveError}</div>}
          {downloadError && <div className="text-red-500 text-sm mt-2">{downloadError}</div>}
          {resetSuccess && <div className="text-green-600 text-sm mt-2">Chat reset!</div>}
          <Chat key={resetCount} toolId={id as string} toolName={productInfo?.name} toolDescription={productInfo?.description} />
        </div>
      </main>
    </div>
  );
} 