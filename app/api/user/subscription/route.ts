import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription from user_profiles table using supabaseAdmin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(null)
    }

    // If user has no subscription or is on FREE tier, return null
    if (!userProfile || !userProfile.subscription || userProfile.subscription === 'FREE') {
      return NextResponse.json(null)
    }

    // For PRO subscription, return a basic subscription object
    if (userProfile.subscription === 'PRO') {
      return NextResponse.json({
        id: 'pro-subscription',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false,
        canceled_at: null,
        plan: {
          id: 'pro-plan',
          name: 'Pro',
          price: 2900, // $29.00 in cents
          interval: 'month',
          description: 'Pro subscription with unlimited access',
          features: ['Unlimited chats', 'Priority support', 'Advanced features'],
          is_popular: true
        }
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
} 