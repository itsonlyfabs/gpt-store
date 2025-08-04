import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Check if Stripe is properly configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    })
  : null;

const isDevelopment = process.env.NODE_ENV === 'development'

export async function POST(request: Request) {
  try {
    console.log('🔍 Plan checkout request received');
    
    // Check if Stripe is configured
    if (!stripe) {
      console.error('❌ Stripe is not configured - missing STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 500 }
      )
    }

    // Verify authentication
    const authHeader = headers().get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    const body = await request.json()
    const { planId, source } = body
    if (!planId) {
      console.error('❌ Missing planId in request body');
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      )
    }

    console.log('📋 Plan ID:', planId);

    // Get plan details from your database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    console.log('📦 Plan found:', plan.name, plan.price);

    if (!plan.stripe_price_id) {
      console.error('❌ Plan missing Stripe price ID:', plan.name);
      return NextResponse.json(
        { error: 'Plan is not configured for payments. Please contact support.' },
        { status: 400 }
      )
    }

    console.log('💳 Stripe price ID:', plan.stripe_price_id);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        planId,
        userId: user.id,
      },
      success_url: isDevelopment
        ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: source === 'billing'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        : `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('❌ Plan checkout error:', error)
    
    // Provide more specific error messages
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create plan checkout session' },
      { status: 500 }
    )
  }
} 