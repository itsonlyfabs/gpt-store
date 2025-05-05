const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const authMiddleware = require('../middleware/auth');
const { supabase, supabaseAdmin } = require('../lib/supabase');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Mock storage for development
const purchases = new Map();
const subscriptions = new Map();

// Create checkout session
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { productId, priceType } = req.body;
    const userId = req.user.id;

    if (!productId || !priceType) {
      return res.status(400).json({
        error: 'Product ID and price type are required'
      });
    }

    if (priceType !== 'one_time' && priceType !== 'subscription') {
      return res.status(400).json({
        error: 'Invalid price type. Must be either "one_time" or "subscription"'
      });
    }

    // Get product details from database
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if user already owns the product
    const { data: existingPurchase, error: checkError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingPurchase) {
      return res.status(400).json({
        error: 'You already own this product. Check your library to access it.',
        code: 'ALREADY_PURCHASED'
      });
    }

    // Development mode
    if (isDevelopment) {
      console.log('Running in development mode - simulating Stripe checkout', { userId, productId });
      
      try {
        // Create a temporary session ID
        const sessionId = `dev_session_${Date.now()}`;

        // Create the purchase record immediately in development mode
        const { data: purchase, error: purchaseError } = await supabaseAdmin
          .from('purchases')
          .insert({
            user_id: userId,
            product_id: productId,
            stripe_session_id: sessionId,
            amount_paid: product.price,
            currency: product.currency || 'USD',
            status: 'completed'
          })
          .select()
          .single();

        if (purchaseError) {
          console.error('Error creating purchase:', purchaseError);
          return res.status(500).json({
            error: 'Failed to create purchase record'
          });
        }

        console.log('Created purchase:', purchase);

        return res.json({
          sessionId,
          success_url: `/checkout/success?session_id=${sessionId}&product_id=${productId}`,
          devMode: true,
          purchase
        });
      } catch (err) {
        console.error('Error in development checkout:', err);
        return res.status(500).json({
          error: 'Failed to process checkout'
        });
      }
    }

    // Production mode - requires Stripe configuration
    if (!stripe) {
      return res.status(500).json({
        error: 'Stripe is not properly configured'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
            recurring: priceType === 'subscription' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: priceType === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId,
        productId,
        priceType,
      },
      customer_email: req.user.email, // Add this if you have the user's email
    });

    res.json({ 
      sessionId: session.id,
      devMode: false
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      error: error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Failed to create checkout session'
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not properly configured');
    }

    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, productId, priceType } = session.metadata;

        // Create the purchase record
        const { error: purchaseError } = await supabaseAdmin
          .from('purchases')
          .insert({
            user_id: userId,
            product_id: productId,
            stripe_session_id: session.id,
            amount_paid: session.amount_total,
            currency: session.currency,
            status: 'completed'
          });

        if (purchaseError) {
          console.error('Error creating purchase record:', purchaseError);
          return res.status(500).json({ error: 'Failed to create purchase record' });
        }

        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Handle subscription changes
        console.log('Subscription event:', event.type, subscription.id);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Webhook handler failed'
    });
  }
});

// Get user's purchases and subscriptions
router.get('/user/purchases', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isDevelopment) {
      // Return mock purchases and subscriptions
      const userPurchases = Array.from(purchases.values())
        .filter(p => p.userId === userId);
      const userSubscriptions = Array.from(subscriptions.values())
        .filter(s => s.userId === userId);

      return res.json({
        purchases: userPurchases,
        subscriptions: userSubscriptions,
      });
    }

    // In production, fetch from database
    throw new Error('Not implemented');
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      error: 'Failed to fetch purchase history'
    });
  }
});

// Add new endpoint to verify session
router.post('/verify-session', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // In development mode, create the purchase record
    if (isDevelopment && sessionId.startsWith('dev_')) {
      const productId = req.body.productId;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
      // Check if already purchased
      const { data: existingPurchase } = await supabaseAdmin
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();
      if (existingPurchase) {
        return res.status(200).json({ success: true, alreadyPurchased: true });
      }
      // Fetch product price/currency
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (productError || !product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      // Create the purchase record
      const { data: purchase, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: productId,
          stripe_session_id: sessionId,
          amount_paid: product.price,
          currency: product.currency || 'USD',
          status: 'completed'
        })
        .select()
        .single();
      if (purchaseError) {
        console.error('Error creating purchase:', purchaseError);
        return res.status(500).json({ error: 'Failed to create purchase record' });
      }
      return res.json({ success: true, purchase });
    }

    // Production mode verification remains the same...
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify that this session belongs to the authenticated user
    if (session.metadata.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    // Verify the session is paid
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

module.exports = router;