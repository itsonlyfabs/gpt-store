'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TeamChat from '@/components/TeamChat'
import Chat from '@/components/Chat'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ChatPage() {
  const params = useParams() as Record<string, string>;
  const id = params.id;
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [checkingBundle, setCheckingBundle] = useState(true)
  const [productInfo, setProductInfo] = useState<any>(null);
  const [bundle, setBundle] = useState<any>(null)

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

  // Single product chat - now uses the mobile-optimized Chat component
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Chat key={id} toolId={id as string} toolName={productInfo?.name} toolDescription={productInfo?.description} />
      </main>
    </div>
  );
} 