import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { paymentMethodId } = await request.json()
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 })
    }

    // Get user's Stripe customer ID from Supabase
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (userProfileError || !userProfile || !userProfile.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Update customer's default payment method
    await stripe.customers.update(userProfile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
} 