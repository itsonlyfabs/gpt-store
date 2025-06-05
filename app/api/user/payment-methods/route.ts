export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

async function ensureStripeCustomer(supabase: any, userProfile: any, sessionUser: any) {
  const email = userProfile.email || sessionUser.email || sessionUser.user_metadata?.email;
  if (!email) return null;
  const customer = await stripe.customers.create({ email });
  // Update user_profiles table with both stripe_customer_id and email
  await supabase.from('user_profiles')
    .update({ stripe_customer_id: customer.id, email })
    .eq('id', userProfile.id);
  return customer.id;
}

export async function GET(request: Request) {
  console.log('PAYMENT METHODS API ROUTE HIT');
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID from user_profiles
    let { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    let stripeCustomerId = userProfile?.stripe_customer_id;
    if (!userProfileError && userProfile && !stripeCustomerId) {
      // Create Stripe customer and update user_profiles row
      stripeCustomerId = await ensureStripeCustomer(supabase, userProfile, session.user);
      userProfile.stripe_customer_id = stripeCustomerId;
    }

    if (userProfileError || !userProfile || !userProfile.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userProfile.stripe_customer_id,
      type: 'card'
    })

    // Get default payment method
    const customer = await stripe.customers.retrieve(userProfile.stripe_customer_id)
    let defaultPaymentMethodId: string | null = null
    if (customer && typeof customer === 'object' && 'invoice_settings' in customer && !('deleted' in customer && customer.deleted)) {
      defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method as string | null
    }

    // Format payment methods
    const formattedPaymentMethods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card?.brand || '',
      last4: method.card?.last4 || '',
      exp_month: method.card?.exp_month || 0,
      exp_year: method.card?.exp_year || 0,
      isDefault: method.id === defaultPaymentMethodId
    }))

    return NextResponse.json(formattedPaymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
} 