'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

interface PurchasedProduct {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  lastUsed: string
  usageMetrics: {
    totalChats: number
    totalTokens: number
    lastChatDate: string
  }
}

interface SupabasePurchase {
  id: string
  product: {
    id: string
    name: string
    description: string
    thumbnail: string
    category: string
  }
}

const supabase = createClientComponentClient()

export default function MyLibraryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<PurchasedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [productMap, setProductMap] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          router.push('/auth/login')
          return
        }

        // Fetch purchased products from Supabase
        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select(`
            id,
            product:products (
              id,
              name,
              description,
              thumbnail,
              category
            )
          `)
          .eq('user_id', session.user.id)
          .eq('status', 'completed')

        if (purchasesError) {
          throw purchasesError
        }

        if (!purchases) {
          setProducts([])
          return
        }

        // Transform the data to match the expected format
        const purchasedProducts = (purchases as unknown as SupabasePurchase[]).map(purchase => ({
          id: purchase.product.id,
          name: purchase.product.name,
          description: purchase.product.description,
          thumbnail: purchase.product.thumbnail,
          category: purchase.product.category,
          lastUsed: new Date().toISOString(), // This would come from chat history in production
          usageMetrics: {
            totalChats: 0, // These would come from actual usage metrics in production
            totalTokens: 0,
            lastChatDate: new Date().toISOString()
          }
        }))

        setProducts(purchasedProducts)
      } catch (err) {
        console.error('Error fetching library:', err)
        setError(err instanceof Error ? err.message : 'Failed to load your library')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedProducts()
  }, [router])

  // Fetch chat sessions
  useEffect(() => {
    const fetchChatSessions = async () => {
      setChatLoading(true)
      setChatError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        console.log('Access token for chat API:', accessToken);
        const res = await fetch('/api/chat/history', {
          headers: {
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setChatSessions(data.sessions || []);
        console.log('Fetched chat sessions:', data.sessions);
      } catch (err) {
        setChatError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setChatLoading(false);
      }
    };
    fetchChatSessions();
  }, [supabase]);

  // Fetch product info for all chat sessions
  useEffect(() => {
    const fetchProducts = async () => {
      if (!chatSessions.length) return;
      const ids = Array.from(new Set(chatSessions.map(s => s.product_id).filter(Boolean)));
      if (!ids.length) return;
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, category')
        .in('id', ids);
      if (products) {
        const map: Record<string, any> = {};
        for (const p of products) map[p.id] = p;
        setProductMap(map);
      }
    };
    fetchProducts();
  }, [chatSessions]);

  const handleOpenChat = async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    // Try to find an existing session for this user/product
    let { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .limit(1);
    let sessionId;
    if (sessions && sessions.length > 0) {
      sessionId = sessions[0].id;
    } else {
      // If not found, create a new session
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{ user_id: userId, product_id: productId }])
        .select('id')
        .single();
      sessionId = newSession && newSession.id ? newSession.id : undefined;
    }
    if (sessionId) {
      router.push(`/chat/${sessionId}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
              <p className="mt-2 text-sm text-gray-600">
                Access your purchased AI tools and view usage statistics
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
            >
              Discover More Tools
            </Link>
          </div>

          {/* Compact Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
              <p className="text-gray-600 mb-6">
                Explore our collection of AI tools to enhance your mental fitness journey
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
              >
                Browse AI Tools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-12">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 text-xs"
                >
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    width={160}
                    height={90}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                      <span className="px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                    <button
                      onClick={() => handleOpenChat(product.id)}
                      className="mt-2 w-full flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Saved Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Chat Saved</h2>
            <p className="mb-4 text-gray-600 text-sm">View and revisit your saved chat sessions with your AI tools. Only chats you have explicitly saved will appear here for quick access.</p>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search saved chats..."
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            </div>
            {chatLoading ? (
              <div className="text-center text-gray-500 py-8">Loading saved chats...</div>
            ) : chatError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">{chatError}</div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No saved chats found.</div>
            ) : (
              <div className="space-y-4">
                {chatSessions
                  .filter(session => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    const product = session.product_id ? productMap[session.product_id] : null;
                    return (
                      (session.title && session.title.toLowerCase().includes(q)) ||
                      (product && product.name && product.name.toLowerCase().includes(q)) ||
                      (product && product.category && product.category.toLowerCase().includes(q)) ||
                      (Array.isArray(session.assistant_ids) && session.assistant_ids.join(',').toLowerCase().includes(q)) ||
                      (session.bundle_id && String(session.bundle_id).toLowerCase().includes(q)) ||
                      (session.product_id && String(session.product_id).toLowerCase().includes(q)) ||
                      (session.id && String(session.id).toLowerCase().includes(q))
                    );
                  })
                  .map(session => {
                    const product = session.product_id ? productMap[session.product_id] : null;
                    return (
                      <div
                        key={session.id}
                        className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition cursor-pointer border border-gray-100"
                        onClick={() => router.push(`/chat/${session.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary text-xs">
                            {product && product.category ? product.category : 'Chat'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 text-sm mb-1 truncate">
                          {session.title ? session.title : (product && product.name ? product.name : (session.is_bundle ? `Bundle ${session.bundle_id ?? ''}` : `Chat ${session.id ?? ''}`))}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {product && product.description ? product.description : 'No description'}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 