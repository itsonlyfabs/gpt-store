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
  const [bundles, setBundles] = useState<any[]>([])
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [showBundleModal, setShowBundleModal] = useState(false)
  const [editingBundle, setEditingBundle] = useState<any | null>(null)
  const [showEditWarning, setShowEditWarning] = useState(false)
  const [pendingEditBundle, setPendingEditBundle] = useState<any | null>(null)
  const [bundleChatSessions, setBundleChatSessions] = useState<Record<string, any[]>>({})

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

  // Fetch bundles for the user
  useEffect(() => {
    const fetchBundles = async () => {
      setBundleLoading(true)
      setBundleError(null)
      try {
        const res = await fetch('/api/bundles')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setBundles(data)
      } catch (err) {
        setBundleError(err instanceof Error ? err.message : 'Failed to load bundles')
      } finally {
        setBundleLoading(false)
      }
    }
    fetchBundles()
  }, [])

  // Fetch chat sessions for each bundle (for warning/recap)
  useEffect(() => {
    const fetchBundleChats = async () => {
      if (!bundles.length) return;
      const chatMap: Record<string, any[]> = {};
      for (const bundle of bundles) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) continue;
        const { data: sessions } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('bundle_id', bundle.id);
        chatMap[bundle.id] = sessions || [];
      }
      setBundleChatSessions(chatMap);
    };
    fetchBundleChats();
  }, [bundles]);

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
    if (sessions && sessions.length > 0 && sessions[0]?.id) {
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
            <div className="flex flex-col gap-2 items-end">
              <Link
                href="/discover"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
              >
                Discover More Tools
              </Link>
              <button
                className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md shadow-sm text-primary bg-white hover:bg-primary/10 mt-2"
                onClick={() => { setShowBundleModal(true); setEditingBundle(null); }}
              >
                + Create Your Own Bundle
              </button>
            </div>
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

          {/* Bundle Chats Carousel */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bundle Chats</h2>
            {bundleLoading ? (
              <div className="text-center text-gray-500 py-8">Loading bundles...</div>
            ) : bundleError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">{bundleError}</div>
            ) : bundles.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No bundles found.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {bundles.map(bundle => (
                  <div key={bundle.id} className="bg-white rounded-lg shadow-sm p-4 min-w-[280px] max-w-xs flex flex-col justify-between border border-gray-100 relative">
                    {/* Show tier in top right for admin bundles only */}
                    {(!bundle.user_id && bundle.tier) && (
                      <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                        {bundle.tier}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1 truncate">{bundle.name}</div>
                      <div className="text-xs text-gray-500 mb-2 truncate">{bundle.description}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Array.isArray(bundle.product_ids) && bundle.product_ids.length > 0 && bundle.product_ids.map((pid: string) => {
                          const nickname = bundle.assistant_nicknames?.[pid];
                          const product = products.find((p: any) => p.id === pid);
                          const label = nickname || product?.name || 'Product';
                          return (
                            <span key={pid} className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1 bg-primary text-white rounded text-xs" onClick={async () => {
                        // Open Chat for bundle: find or create a chat session for this bundle
                        const { data: { session } } = await supabase.auth.getSession();
                        const userId = session?.user?.id;
                        if (!userId) return;
                        let { data: sessions } = await supabase
                          .from('chat_sessions')
                          .select('id')
                          .eq('user_id', userId)
                          .eq('bundle_id', bundle.id)
                          .limit(1);
                        let sessionId;
                        if (sessions && sessions.length > 0 && sessions[0]?.id) {
                          sessionId = sessions[0].id;
                        } else {
                          // If not found, create a new session
                          const { data: newSession, error } = await supabase
                            .from('chat_sessions')
                            .insert([{ user_id: userId, bundle_id: bundle.id, assistant_nicknames: bundle.assistant_nicknames }])
                            .select('id')
                            .single();
                          sessionId = newSession && newSession.id ? newSession.id : undefined;
                        }
                        if (sessionId) {
                          router.push(`/chat/${sessionId}`);
                        }
                      }}>Open Chat</button>
                      {bundle.user_id ? (
                        <>
                          <button className="px-3 py-1 border border-primary text-primary bg-white hover:bg-primary/10 rounded text-xs" onClick={() => {
                            // If bundle has chat sessions, show warning first
                            if (bundleChatSessions[bundle.id] && bundleChatSessions[bundle.id].length > 0) {
                              setPendingEditBundle(bundle);
                              setShowEditWarning(true);
                            } else {
                              setEditingBundle(bundle);
                              setShowBundleModal(true);
                            }
                          }}>Edit</button>
                          <button className="px-3 py-1 border border-red-500 text-red-500 bg-white hover:bg-red-50 rounded text-xs" onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this bundle?')) return;
                            setBundleLoading(true);
                            await fetch(`/api/bundles/${bundle.id}`, { method: 'DELETE' });
                            // Refresh bundles
                            const res = await fetch('/api/bundles');
                            const data = await res.json();
                            setBundles(data);
                            setBundleLoading(false);
                          }}>Delete</button>
                        </>
                      ) : (
                        <>
                          <button className="px-3 py-1 border border-primary text-primary bg-white hover:bg-primary/10 rounded text-xs" onClick={() => {
                            // Clone admin bundle: open modal prefilled, but saving creates a new user bundle
                            setEditingBundle({ ...bundle, id: undefined, user_id: undefined });
                            setShowBundleModal(true);
                          }}>Clone</button>
                          <button className="px-3 py-1 border border-red-500 text-red-500 bg-white hover:bg-red-50 rounded text-xs" onClick={async () => {
                            // Remove admin bundle from user's library (persistent)
                            setBundleLoading(true);
                            await fetch(`/api/bundles/remove`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bundle_id: bundle.id })
                            });
                            // Refresh bundles
                            const res = await fetch('/api/bundles');
                            const data = await res.json();
                            setBundles(data);
                            setBundleLoading(false);
                          }}>Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bundle Creation/Edit Modal */}
          {showBundleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowBundleModal(false)}>&times;</button>
                <h2 className="text-xl font-bold mb-4">{editingBundle ? 'Edit Bundle' : 'Create New Bundle'}</h2>
                <BundleForm
                  products={products}
                  editingBundle={editingBundle}
                  onClose={() => { setShowBundleModal(false); setEditingBundle(null); }}
                  onSaved={async () => {
                    setShowBundleModal(false); setEditingBundle(null);
                    // Refresh bundles
                    setBundleLoading(true);
                    const res = await fetch('/api/bundles');
                    const data = await res.json();
                    setBundles(data);
                    setBundleLoading(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Edit Warning Modal */}
          {showEditWarning && pendingEditBundle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => { setShowEditWarning(false); setPendingEditBundle(null); }}>&times;</button>
                <h2 className="text-xl font-bold mb-4">Editing this bundle will reset its chat history</h2>
                <p className="mb-4 text-gray-700">If you proceed, all chat history for this bundle will be lost. You can download a recap of your chats before continuing.</p>
                <div className="flex gap-2 mt-4">
                  <button className="bg-primary text-white px-4 py-2 rounded" onClick={async () => {
                    // Download recap for all chat sessions of this bundle
                    const sessions = bundleChatSessions[pendingEditBundle.id] || [];
                    for (const session of sessions) {
                      const res = await fetch(`/api/chat/session/${session.id}/recap`, { method: 'POST' });
                      const data = await res.json();
                      if (data.recap) {
                        const blob = new Blob([data.recap], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `bundle-chat-recap-${session.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }
                  }}>Download Recap</button>
                  <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => {
                    setEditingBundle(pendingEditBundle);
                    setShowBundleModal(true);
                    setShowEditWarning(false);
                    setPendingEditBundle(null);
                  }}>Proceed Anyway</button>
                  <button className="px-4 py-2 rounded border" onClick={() => { setShowEditWarning(false); setPendingEditBundle(null); }}>Cancel</button>
                </div>
              </div>
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

function BundleForm({ products, editingBundle, onClose, onSaved }: { products: any[], editingBundle: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = React.useState({
    name: editingBundle?.name || '',
    description: editingBundle?.description || '',
    image: editingBundle?.image || '',
  });
  const [selected, setSelected] = React.useState<string[]>(editingBundle?.product_ids || []);
  const [nicknames, setNicknames] = React.useState<Record<string, string>>(editingBundle?.assistant_nicknames || {});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
    setNicknames(nicks => {
      const copy = { ...nicks };
      if (selected.includes(id)) delete copy[id];
      return copy;
    });
  };
  const handleNicknameChange = (id: string, value: string) => {
    setNicknames(nicks => ({ ...nicks, [id]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const method = editingBundle && editingBundle.id ? 'PUT' : 'POST';
      const url = editingBundle && editingBundle.id ? `/api/bundles/${editingBundle.id}` : '/api/bundles';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productIds: selected, assistant_nicknames: nicknames })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${editingBundle && editingBundle.id ? 'edit' : 'create'} bundle`);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" value={form.name} onChange={handleChange} placeholder="Bundle Name" className="w-full border p-2" required />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2" required />
      <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="w-full border p-2" required />
      <div>
        <div className="font-semibold mb-2">Select Products for this Bundle:</div>
        <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
          {products.length === 0 ? (
            <div className="text-gray-400">No products found.</div>
          ) : products.map((p) => (
            <div key={p.id} className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => handleSelect(p.id)}
                className="accent-blue-600"
              />
              <span>{p.name}</span>
              {selected.includes(p.id) && (
                <input
                  type="text"
                  placeholder="Nickname (optional)"
                  value={nicknames[p.id] || ''}
                  onChange={e => handleNicknameChange(p.id, e.target.value)}
                  className="ml-2 border px-2 py-1 rounded text-xs"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>{loading ? (editingBundle && editingBundle.id ? 'Saving...' : 'Creating...') : (editingBundle && editingBundle.id ? 'Save Changes' : 'Create Bundle')}</button>
        <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 