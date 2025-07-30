'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

function EmailVerificationCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error parameters
        const errorCode = searchParams?.get('error_code')
        const errorDescription = searchParams?.get('error_description')
        if (errorCode) {
          throw new Error(errorDescription || 'Verification failed')
        }

        // Poll for session (OAuth flow)
        let session = null
        for (let i = 0; i < 15; i++) { // poll for up to 3 seconds
          const { data } = await supabase.auth.getSession()
          if (data.session?.user) {
            session = data.session
            break
          }
          await new Promise(res => setTimeout(res, 200))
        }
        if (session?.user) {
          // Create or update user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Anonymous',
              marketing_emails: true, // Default to true for new users
              email_notifications: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .single()
          
          if (profileError) {
            console.error('Profile update error:', profileError)
          } else if (profile?.marketing_emails && profile?.email) {
            // Sync to Resend audience list
            try {
              const { addContactToAudience } = await import('@/lib/resend')
              const result = await addContactToAudience({
                email: profile.email,
                name: profile.name,
                unsubscribed: false
              })
              if (result?.error) {
                console.error('Failed to sync user to Resend audience:', result.error)
              } else {
                console.log('User synced to Resend audience:', profile.email)
              }
            } catch (error) {
              console.error('Failed to sync user to Resend audience:', error)
            }
          }
          
          // Redirect to dashboard
          const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/discover`
            : '/discover';
          router.push(dashboardUrl)
          return
        }

        // If not authenticated, handle email verification flow
        const code = searchParams?.get('code')
        if (!code) {
          throw new Error('Missing verification code')
        }
        const { data, error: verifyError } = await supabase.auth.exchangeCodeForSession(code)
        if (verifyError) {
          console.error('Verification error:', verifyError)
          throw verifyError
        }
        if (!data.session) {
          throw new Error('No session received after verification')
        }
        // Create or update user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'Anonymous',
            marketing_emails: true, // Default to true for new users
            email_notifications: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .single()
        
        if (profileError) {
          console.error('Profile update error:', profileError)
        } else if (profile?.marketing_emails && profile?.email) {
          // Sync to Resend audience list
          try {
            const { addContactToAudience } = await import('@/lib/resend')
            const result = await addContactToAudience({
              email: profile.email,
              name: profile.name,
              unsubscribed: false
            })
            if (result?.error) {
              console.error('Failed to sync user to Resend audience:', result.error)
            } else {
              console.log('User synced to Resend audience:', profile.email)
            }
          } catch (error) {
            console.error('Failed to sync user to Resend audience:', error)
          }
        }
        // Redirect to login with success message
        router.push('/auth/login?verified=true')
      } catch (err) {
        console.error('Verification error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify email'
        setError(errorMessage)
        // Redirect to login with error message after a short delay
        setTimeout(() => {
          router.push('/auth/login?error=verification_failed')
        }, 3000)
      }
    }
    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verifying your email...
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please wait while we complete the verification process.
        </p>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  )
}

export default function EmailVerificationCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailVerificationCallbackInner />
    </Suspense>
  )
} 