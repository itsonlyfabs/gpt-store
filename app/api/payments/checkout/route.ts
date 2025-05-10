import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const isDevelopment = process.env.NODE_ENV === 'development'

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = headers().get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { productId, priceType } = body

    if (!productId || !priceType) {
      return NextResponse.json(
        { error: 'Product ID and price type are required' },
        { status: 400 }
      )
    }

    // Get product details from your database
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user has already purchased this product
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this product' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      mode: priceType === 'subscription' ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: product.currency || 'USD',
            product_data: {
              name: product.name,
              description: product.description,
              images: product.thumbnail ? [product.thumbnail] : undefined,
            },
            unit_amount: product.price,
            recurring: priceType === 'subscription' ? {
              interval: 'month',
            } : undefined,
          },
          quantity: 1,
        },
      ],
      metadata: {
        productId,
        userId: user.id,
      },
      success_url: isDevelopment
        ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${productId}`,
    })

    // Create a pending purchase record
    await supabase.from('purchases').insert({
      user_id: user.id,
      product_id: productId,
      stripe_session_id: session.id,
      amount_paid: product.price,
      currency: product.currency || 'USD',
      status: 'pending',
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 