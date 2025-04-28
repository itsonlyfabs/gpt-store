const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const authMiddleware = require('../middleware/auth');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Stripe only if we have a valid key and are not in development mode
const stripe = !isDevelopment && process.env.STRIPE_SECRET_KEY
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

    // Development mode
    if (isDevelopment) {
      console.log('Running in development mode - simulating Stripe checkout');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      const mockPurchase = {
        id: `dev_purchase_${Date.now()}`,
        userId,
        productId,
        priceType,
        amount: 2999, // $29.99
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      if (priceType === 'subscription') {
        subscriptions.set(mockPurchase.id, mockPurchase);
      } else {
        purchases.set(mockPurchase.id, mockPurchase);
      }

      return res.json({
        sessionId: `dev_session_${Date.now()}_${productId}`,
        devMode: true,
        message: 'Development mode: Simulating successful purchase. You will be redirected shortly.'
      });
    }

    // Production mode - requires Stripe configuration
    if (!stripe) {
      return res.status(500).json({
        error: 'Stripe is not properly configured'
      });
    }

    // In production, fetch product details from your database
    const product = {
      name: 'Focus Enhancement AI',
      description: 'AI-powered tool for improving focus and concentration',
      price: 2999, // $29.99
    };

    // Create Stripe checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId,
        productId,
        priceType,
      },
    });

    res.json({ sessionId: session.id });
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
    // Development mode
    if (isDevelopment) {
      console.log('Development mode - webhook events are simulated');
      return res.json({ received: true });
    }

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

        // In production, store purchase/subscription in database
        // For now, just log the successful payment
        console.log('Payment successful:', {
          userId,
          productId,
          priceType,
          amount: session.amount_total,
          paymentStatus: session.payment_status,
        });
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

module.exports = router; 