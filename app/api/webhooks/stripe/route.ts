import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('🔔 Webhook event received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('✅ Checkout session completed:', session.id)

        // Handle plan subscriptions
        if (session.mode === 'subscription' && session.metadata?.planId) {
          const { planId, userId } = session.metadata
          
          console.log('📋 Processing plan subscription:', { planId, userId })

          // Get plan details
          const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

          if (planError || !plan) {
            console.error('❌ Plan not found:', planError)
            return NextResponse.json(
              { error: 'Plan not found' },
              { status: 400 }
            )
          }

          // Create or update subscription
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (existingSub) {
            // Update existing subscription
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan_id: planId,
                status: 'active',
                stripe_subscription_id: session.subscription as string,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSub.id)

            if (updateError) {
              console.error('❌ Error updating subscription:', updateError)
              return NextResponse.json(
                { error: 'Failed to update subscription' },
                { status: 500 }
              )
            }
          } else {
            // Create new subscription
            const { error: insertError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                plan_id: planId,
                status: 'active',
                stripe_subscription_id: session.subscription as string,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (insertError) {
              console.error('❌ Error creating subscription:', insertError)
              return NextResponse.json(
                { error: 'Failed to create subscription' },
                { status: 500 }
              )
            }
          }

          console.log('✅ Subscription created/updated successfully')
        }

        // Handle product purchases
        if (session.mode === 'payment' && session.metadata?.productId) {
          const { productId, userId } = session.metadata
          
          console.log('📦 Processing product purchase:', { productId, userId })

          // Create purchase record
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              product_id: productId,
              stripe_session_id: session.id,
              amount_paid: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'completed',
            })

          if (purchaseError) {
            console.error('❌ Error creating purchase record:', purchaseError)
            return NextResponse.json(
              { error: 'Failed to create purchase record' },
              { status: 500 }
            )
          }

          console.log('✅ Purchase record created successfully')
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('📋 Subscription event:', event.type, subscription.id)

        // Update subscription status in database
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : 'active'
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('❌ Error updating subscription status:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription status' },
            { status: 500 }
          )
        }

        console.log('✅ Subscription status updated:', status)
        break
      }

      default:
        console.log('📝 Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
} 