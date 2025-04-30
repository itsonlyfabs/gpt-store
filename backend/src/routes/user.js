const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Mock data for development
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'AI-powered tool to help you maintain focus and concentration during work sessions.',
    thumbnail: 'https://picsum.photos/seed/focus/800/400',
    category: 'Focus & Concentration',
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    usageMetrics: {
      totalChats: 15,
      totalTokens: 3500,
      lastChatDate: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation sessions with AI-guided breathing exercises.',
    thumbnail: 'https://picsum.photos/seed/meditation/800/400',
    category: 'Meditation & Mindfulness',
    lastUsed: new Date(Date.now() - 172800000).toISOString(),
    usageMetrics: {
      totalChats: 8,
      totalTokens: 2100,
      lastChatDate: new Date(Date.now() - 172800000).toISOString(),
    },
  },
];

// Get user's library
router.get('/library', authMiddleware, async (req, res) => {
  console.log('GET /api/user/library called');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('User:', req.user);
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock products');
      return res.json({ products: MOCK_PRODUCTS });
    }

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
        .select('id, created_at')
        .eq('user_id', req.user.id)
        .eq('product_id', up.product_id);

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