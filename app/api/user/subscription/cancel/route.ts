import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the latest active subscription for the user
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !sub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    let cancelAtDate = null
    let cancelAtPeriodEnd = false

    // If there is a Stripe subscription, set cancel_at_period_end=true
    if (sub.stripe_subscription_id) {
      try {
        const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'cancel_at_period_end=true',
        })
        const stripeData = await stripeRes.json()
        if (!stripeRes.ok) {
          return NextResponse.json({ error: 'Failed to set cancel at period end in Stripe', details: stripeData }, { status: 500 })
        }
        cancelAtPeriodEnd = !!stripeData.cancel_at_period_end
        if (stripeData.current_period_end) {
          cancelAtDate = new Date(stripeData.current_period_end * 1000).toISOString()
        }
      } catch (stripeError) {
        return NextResponse.json({ error: 'Stripe API error', details: stripeError }, { status: 500 })
      }
    }

    // Update subscription in DB: set cancel_at_period_end and canceled_at (date when it will end)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: cancelAtPeriodEnd, 
        canceled_at: cancelAtDate, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', sub.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription', details: updateError }, { status: 500 })
    }

    return NextResponse.json({ success: true, cancel_at_period_end: cancelAtPeriodEnd, canceled_at: cancelAtDate })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 