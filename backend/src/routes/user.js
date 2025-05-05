const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../lib/supabase');

// Get user's library
router.get('/library', authMiddleware, async (req, res) => {
  console.log('GET /api/user/library called');
  console.log('User:', req.user);
  
  try {
    // Get user's purchased products from Supabase
    const { data: userProducts, error: userProductsError } = await supabase
      .from('user_products')
      .select(`
        product_id,
        purchased_at,
        products (
          id,
          name,
          description,
          thumbnail,
          category
        )
      `)
      .eq('user_id', req.user.id);

    if (userProductsError) {
      throw userProductsError;
    }

    // Get usage metrics for each product
    const products = await Promise.all(userProducts.map(async (up) => {
      const { data: metrics, error: metricsError } = await supabase
        .from('chat_history')
        .select('id, created_at, tokens')
        .eq('user_id', req.user.id)
        .eq('product_id', up.product_id)
        .order('created_at', { ascending: false });

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        return null;
      }

      const lastChat = metrics?.[0]?.created_at;

      return {
        id: up.products.id,
        name: up.products.name,
        description: up.products.description,
        thumbnail: up.products.thumbnail,
        category: up.products.category,
        lastUsed: lastChat || up.purchased_at,
        usageMetrics: {
          totalChats: metrics?.length || 0,
          totalTokens: metrics?.reduce((acc, m) => acc + (m.tokens || 0), 0) || 0,
          lastChatDate: lastChat || up.purchased_at,
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

module.exports = router; 