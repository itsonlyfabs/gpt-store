const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatWithAI } = require('../services/aiService');
const { supabase } = require('../lib/supabase');

// Rate limiting for development (in production, use Redis or a proper rate limiter)
const rateLimits = new Map();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit) {
    rateLimits.set(userId, {
      count: 1,
      timestamp: now
    });
    return true;
  }

  // Reset counter if it's been more than a minute
  if (now - userLimit.timestamp > 60000) {
    rateLimits.set(userId, {
      count: 1,
      timestamp: now
    });
    return true;
  }

  // Limit to 10 messages per minute
  if (userLimit.count >= 10) {
    return false;
  }

  userLimit.count += 1;
  return true;
};

// Chat endpoint
router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message is required' });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    // Fetch assistant_id for the product from Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('assistant_id')
      .eq('id', productId)
      .single();

    if (productError || !product || !product.assistant_id) {
      return res.status(404).json({ error: 'Product or Assistant not found' });
    }

    const messages = [{
      role: 'user',
      content: message
    }];

    // Pass assistant_id to chatWithAI
    const response = await chatWithAI(userId, productId, messages, { assistant_id: product.assistant_id });

    // Store the conversation in Supabase
    const convId = conversationId || Date.now().toString();
    const { error: storeError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          product_id: productId,
          conversation_id: convId,
          role: 'user',
          content: message
        },
        {
          user_id: userId,
          product_id: productId,
          conversation_id: convId,
          role: 'assistant',
          content: response.content
        }
      ]);

    if (storeError) {
      console.error('Failed to store chat messages:', storeError);
    }

    res.json({
      response: response.content,
      usage: response.usage,
      conversationId: convId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get chat history endpoint
router.get('/:productId/history', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { conversationId } = req.query;
    const userId = req.user.id;

    const query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (conversationId) {
      query.eq('conversation_id', conversationId);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      messages: messages || [],
      hasMore: false
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router; 