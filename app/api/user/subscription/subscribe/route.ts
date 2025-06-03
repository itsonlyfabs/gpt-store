import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { planId } = await request.json()
    if (!planId) {
      console.error('No planId provided')
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }
    console.log('Subscribing user', session.user.id, 'to plan', planId)

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    if (planError || !plan) {
      console.error('Plan fetch error:', planError, 'plan:', plan)
      return NextResponse.json({ error: 'Plan not found', details: planError }, { status: 404 })
    }
    console.log('Fetched plan:', plan)

    // Only allow Free and Pro plans
    if (plan.name !== 'Free' && plan.name !== 'Pro') {
      console.error('Attempt to subscribe to disallowed plan:', plan.name)
      return NextResponse.json({ error: 'Only Free and Pro plans are available at this time.' }, { status: 400 })
    }

    // Check if user already has a subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (subError) {
      console.error('Error fetching existing subscription:', subError)
    }
    console.log('Existing subscription:', existingSub)

    let result
    // If plan is free, just create or update the DB row
    if (plan.price === 0) {
      console.log('Processing free plan logic')
      if (existingSub) {
        const { data, error } = await supabase
          .from('subscriptions')
          .update({ plan_id: planId, status: 'active', updated_at: new Date().toISOString(), stripe_subscription_id: null })
          .eq('id', existingSub.id)
          .select()
          .single()
        if (error) {
          console.error('Update subscription error:', error)
          return NextResponse.json({ error: 'Failed to update subscription', details: error }, { status: 500 })
        }
        result = data
      } else {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.user.id,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stripe_subscription_id: null
          })
          .select()
          .single()
        if (error) {
          console.error('Insert subscription error:', error)
          return NextResponse.json({ error: 'Failed to create subscription', details: error }, { status: 500 })
        }
        result = data
      }
      return NextResponse.json({ success: true, subscription: result })
    }

    // For paid plans, create Stripe subscription
    if (!plan.stripe_price_id) {
      console.error('No Stripe price ID for this plan:', plan)
      return NextResponse.json({ error: 'No Stripe price ID for this plan' }, { status: 400 })
    }
    console.log('Stripe price ID:', plan.stripe_price_id)

    // Find or create Stripe customer
    let customerId = null
    if (!session.user.email) {
      console.error('User email is required for Stripe customer')
      return NextResponse.json({ error: 'User email is required for Stripe customer' }, { status: 400 })
    }
    try {
      const customers = await stripe.customers.list({ email: session.user.email, limit: 1 })
      const firstCustomer = customers.data[0]
      if (customers.data.length > 0 && firstCustomer && 'id' in firstCustomer) {
        customerId = firstCustomer.id
      } else {
        const customer = await stripe.customers.create({ email: session.user.email })
        customerId = customer.id
      }
    } catch (stripeCustomerError) {
      console.error('Stripe customer error:', stripeCustomerError)
      return NextResponse.json({ error: 'Stripe customer error', details: stripeCustomerError }, { status: 500 })
    }
    console.log('Stripe customer ID:', customerId)

    // Create Stripe subscription
    let stripeSub
    try {
      stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripe_price_id! }],
        payment_behavior: 'default_incomplete',
      })
    } catch (stripeSubError) {
      console.error('Stripe subscription creation error:', stripeSubError)
      return NextResponse.json({ error: 'Stripe subscription creation error', details: stripeSubError }, { status: 500 })
    }
    console.log('Stripe subscription created:', stripeSub)

    // Save subscription in Supabase
    if (existingSub) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          updated_at: new Date().toISOString(),
          stripe_subscription_id: stripeSub.id
        })
        .eq('id', existingSub.id)
        .select()
        .single()
      if (error) {
        console.error('Update subscription error:', error)
        return NextResponse.json({ error: 'Failed to update subscription', details: error }, { status: 500 })
      }
      result = data
    } else {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stripe_subscription_id: stripeSub.id
        })
        .select()
        .single()
      if (error) {
        console.error('Insert subscription error:', error)
        return NextResponse.json({ error: 'Failed to create subscription', details: error }, { status: 500 })
      }
      result = data
    }
    console.log('Subscription saved in Supabase:', result)

    return NextResponse.json({ success: true, subscription: result, stripe_subscription_id: stripeSub.id })
  } catch (error) {
    console.error('Error subscribing to plan:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, stack: error.stack },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to subscribe to plan', details: error },
      { status: 500 }
    )
  }
} 