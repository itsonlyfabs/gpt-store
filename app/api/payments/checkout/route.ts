import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
})

type CheckoutBody = {
  productId: string
  priceType: 'subscription' | 'one_time'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, priceType } = body as CheckoutBody
    
    // Get the host from the request headers
    const headersList = headers();
    const host = headersList.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3002';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

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

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
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
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
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