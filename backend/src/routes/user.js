const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

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
  try {
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      return res.json({ products: MOCK_PRODUCTS });
    }

    // In production, fetch from database
    // TODO: Implement database query
    res.json({ products: [] });
  } catch (error) {
    console.error('Error fetching user library:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

module.exports = router; 