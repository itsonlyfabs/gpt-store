const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatWithAI } = require('../services/aiService');

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

    // In production, fetch conversation history from database
    // For development, we'll just use the single message
    const messages = [{
      role: 'user',
      content: message
    }];

    // Get AI response
    const response = await chatWithAI(userId, productId, messages);

    // In production, store the conversation in database
    // For development, just return the response
    res.json({
      response: response.content,
      usage: response.usage,
      conversationId: conversationId || Date.now().toString()
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

    // In production, fetch from database
    // For development, return empty history
    res.json({
      messages: [],
      hasMore: false
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router; 