import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's Stripe customer ID from user_profiles
  const { data: userProfile, error: userProfileError } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  if (userProfileError || !userProfile || !userProfile.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: userProfile.stripe_customer_id,
    return_url: process.env.NEXT_PUBLIC_APP_URL + '/billing'
  })

  return NextResponse.json({ url: portalSession.url })
} 