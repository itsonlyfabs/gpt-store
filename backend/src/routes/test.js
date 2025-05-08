const express = require('express');
const router = express.Router();
const AppError = require('../utils/errors');
const { supabase, supabaseAdmin } = require('../lib/supabase');

// Test route for 404
router.get('/not-found', (req, res, next) => {
  next(new AppError('Resource not found', 404));
});

// Test route for 400
router.get('/bad-request', (req, res, next) => {
  next(new AppError('Invalid request', 400));
});

// Test route for 500
router.get('/server-error', (req, res, next) => {
  throw new Error('Unexpected server error');
});

// Test route to create chat_messages table
router.post('/setup-chat-table', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.rpc('create_chat_messages_table');
    if (error) throw error;
    res.json({ success: true, message: 'Chat messages table created' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to setup chat table' });
  }
});

// Test route for chat (no auth required)
router.post('/chat', async (req, res) => {
  try {
    const { message, productId, conversationId } = req.body;
    const testUserId = 'test-user-123';

    // Store test message
    const { error: storeError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: testUserId,
          product_id: productId || 'test-product',
          conversation_id: conversationId || 'test-conv',
          role: 'user',
          content: message
        }
      ]);

    if (storeError) {
      throw storeError;
    }

    res.json({ success: true, message: 'Test message stored' });
  } catch (error) {
    console.error('Test chat error:', error);
    res.status(500).json({ error: 'Failed to store test message' });
  }
});

// Test route to get chat history (no auth required)
router.get('/chat-history', async (req, res) => {
  try {
    const { productId, conversationId } = req.query;
    const testUserId = 'test-user-123';

    const query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', testUserId)
      .eq('product_id', productId || 'test-product')
      .order('created_at', { ascending: true });

    if (conversationId) {
      query.eq('conversation_id', conversationId);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Test chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch test chat history' });
  }
});

module.exports = router; 