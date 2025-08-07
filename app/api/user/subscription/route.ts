import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log('❌ No session found in subscription API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Subscription API called for user:', session.user.id)
    console.log('User email:', session.user.email)

    // Get user's subscription from user_profiles table using supabaseAdmin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      return NextResponse.json(null)
    }

    console.log('📋 User profile found:', userProfile)

    // If user has no subscription or is on FREE tier, return null
    if (!userProfile || !userProfile.subscription || userProfile.subscription === 'FREE') {
      console.log('ℹ️ User has FREE subscription or no subscription')
      return NextResponse.json(null)
    }

    // For PRO subscription, fetch the actual plan details from the plans table
    if (userProfile.subscription === 'PRO') {
      console.log('✅ User has PRO subscription, fetching plan details...')
      
      // Get the monthly Pro plan by default (you can extend this to handle yearly plans)
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('tier', 'pro') // Changed from 'PRO' to 'pro' to match the database
        .eq('interval', 'month')
        .single()

      if (planError) {
        console.error('❌ Error fetching Pro plan from database:', planError)
        
        // If the plans table doesn't exist, we need to create it or use a different approach
        if (planError.code === '42P01') {
          console.log('Plans table does not exist, need to create it first')
        }
        
        // For now, return null so the user sees they need to set up the plans table
        return NextResponse.json(null)
      }

      if (!plan) {
        console.error('❌ No Pro plan found in database')
        return NextResponse.json(null)
      }

      console.log('✅ Found Pro plan in database:', {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        stripe_price_id: plan.stripe_price_id
      })

      const subscriptionData = {
        id: 'pro-subscription',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          interval: plan.interval,
          description: plan.description,
          features: plan.features || [],
          is_popular: plan.is_popular || false,
          stripe_price_id: plan.stripe_price_id
        }
      }

      console.log('📤 Returning subscription data:', subscriptionData)
      return NextResponse.json(subscriptionData)
    }

    console.log('ℹ️ User subscription type not handled:', userProfile.subscription)
    return NextResponse.json(null)
  } catch (error) {
    console.error('❌ Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
} 