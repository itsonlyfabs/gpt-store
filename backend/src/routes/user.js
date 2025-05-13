const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../lib/supabase');

// Get user's library
router.get('/library', authMiddleware, async (req, res) => {
  console.log('GET /api/user/library called');
  console.log('Authenticated user:', req.user);
  console.log('Request headers:', req.headers);
  
  try {
    // Get user's purchased products from Supabase (using purchases table)
    const { data: userPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        product_id,
        created_at,
        products:product_id (
          id,
          name,
          description,
          thumbnail,
          category
        )
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'completed');

    console.log('Raw userPurchases:', userPurchases); // Debug join result

    if (purchasesError) {
      throw purchasesError;
    }

    // Simple purchases query for debugging
    const { data: simplePurchases, error: simplePurchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'completed');
    console.log('Simple purchases query:', simplePurchases, simplePurchasesError);

    // Get usage metrics for each product
    const products = await Promise.all(userPurchases.map(async (purchase) => {
      const { data: metrics, error: metricsError } = await supabase
        .from('chat_history')
        .select('id, created_at')
        .eq('user_id', req.user.id)
        .eq('product_id', purchase.product_id)
        .order('created_at', { ascending: false });

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        return null;
      }

      const lastChat = metrics?.[0]?.created_at;

      return {
        id: purchase.products.id,
        name: purchase.products.name,
        description: purchase.products.description,
        thumbnail: purchase.products.thumbnail,
        category: purchase.products.category,
        lastUsed: lastChat || purchase.created_at,
        usageMetrics: {
          totalChats: metrics?.length || 0,
          lastChatDate: lastChat || purchase.created_at,
        },
      };
    }));

    // Filter out any null products from errors
    const validProducts = products.filter(Boolean);

    res.json({ products: validProducts });
  } catch (error) {
    console.error('Error fetching user library:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

// Add product to user's library
router.post('/library', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    console.log('[POST /user/library] userId:', userId, 'productId:', productId);
    if (!productId) {
      console.log('[POST /user/library] Missing productId');
      return res.status(400).json({ error: 'Missing productId' });
    }
    // Check if already purchased
    const { data: existing, error: checkError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .single();
    console.log('[POST /user/library] Existing purchase:', existing, 'Error:', checkError);
    if (existing) {
      return res.status(400).json({ error: 'You already own this product.' });
    }
    // Insert new purchase with all required fields
    const insertPayload = {
      user_id: userId,
      product_id: productId,
      stripe_session_id: 'manual',
      amount_paid: 0,
      currency: 'USD',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    console.log('[POST /user/library] Insert payload:', insertPayload);
    const { data, error } = await supabase
      .from('purchases')
      .insert(insertPayload)
      .select()
      .single();
    console.log('[POST /user/library] Insert result:', data, 'Error:', error);
    if (error) throw error;
    res.status(201).json({ success: true, purchase: data });
  } catch (error) {
    console.error('Error adding product to library:', error);
    res.status(500).json({ error: 'Failed to add product to library', details: error.message });
  }
});

module.exports = router; 