'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    const supabase = createClientComponentClient()
    supabase.auth.getSession().then(console.log)
  }, [])
  return <div>Test</div>
}