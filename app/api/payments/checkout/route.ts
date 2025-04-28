import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

// Only initialize Stripe if we have a valid key and are not in development mode
const stripe = !isDevelopment && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    })
  : null

type CheckoutBody = {
  productId: string
  priceType: 'subscription' | 'one_time'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, priceType } = body as CheckoutBody

    // Validate request body
    if (!productId || !priceType) {
      return NextResponse.json(
        { error: 'Product ID and price type are required' },
        { status: 400 }
      )
    }

    if (priceType !== 'subscription' && priceType !== 'one_time') {
      return NextResponse.json(
        { error: 'Invalid price type. Must be either "subscription" or "one_time"' },
        { status: 400 }
      )
    }

    // Development mode
    if (isDevelopment) {
      console.log('Running in development mode - simulating Stripe checkout')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      return NextResponse.json({
        sessionId: `dev_session_${Date.now()}_${productId}`,
        devMode: true,
        message: 'Development mode: Simulating successful purchase. You will be redirected shortly.'
      })
    }

    // Production mode - requires Stripe configuration
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // In a real application, fetch the product details from your database
    const product = {
      name: 'Sample Product',
      description: 'This is a sample product description',
      price: 2999, // $29.99
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
            recurring: priceType === 'subscription' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: priceType === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
      metadata: {
        productId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 