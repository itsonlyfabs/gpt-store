'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactMarkdown from 'react-markdown'

export default function ChatRecapPage() {
  const { id } = useParams()
  const supabase = createClientComponentClient()
  const [recap, setRecap] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)

  useEffect(() => {
    const fetchRecap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const res = await fetch(`/api/chat/${id}`, {
          headers: {
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        });
        const data = await res.json();
        
        if (data.session) {
          setRecap(data.session.recap);
          if (data.products && data.products[0]) {
            setProductInfo(data.products[0]);
          }
        } else {
          setError('Recap not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load recap');
      } finally {
        setLoading(false);
      }
    }
    fetchRecap();
  }, [id, supabase]);

  const handleDownload = () => {
    if (!recap) return;
    setDownloadLoading(true);
    try {
      const blob = new Blob([recap], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-recap-${id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download recap:', err);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <span>Loading recap...</span>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </main>
      </div>
    )
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
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDownload}
              disabled={downloadLoading || !recap}
              className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {downloadLoading ? 'Downloading...' : 'Download'}
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="prose max-w-none">
              <ReactMarkdown>{recap || 'No recap available'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 