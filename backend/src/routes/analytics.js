const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../lib/supabase');

// Helper functions
const getMostFrequent = (arr) => {
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
};

const calculateAverageSessionLength = (chatStats) => {
  if (!chatStats.length) return 0;
  const sessions = [];
  let currentSession = [];
  
  chatStats.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  chatStats.forEach((chat, i) => {
    currentSession.push(chat);
    if (i === chatStats.length - 1 || 
        new Date(chatStats[i + 1].created_at) - new Date(chat.created_at) > 30 * 60 * 1000) {
      sessions.push(currentSession);
      currentSession = [];
    }
  });
  
  return sessions.reduce((acc, session) => acc + session.length, 0) / sessions.length;
};

const calculateUsageTrend = (stats) => {
  const dailyUsage = stats.reduce((acc, stat) => {
    const date = new Date(stat.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(dailyUsage).map(([date, count]) => ({ date, count }));
};

const calculateUserRetention = (stats) => {
  const userSessions = stats.reduce((acc, stat) => {
    const userId = stat.user_id;
    if (!acc[userId]) {
      acc[userId] = new Set();
    }
    acc[userId].add(new Date(stat.created_at).toISOString().split('T')[0]);
    return acc;
  }, {});
  
  return Object.values(userSessions).map(sessions => sessions.size);
};

// User Analytics
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's chat statistics
    const { data: chatStats, error: chatError } = await supabase
      .from('chat_history')
      .select('product_id, created_at')
      .eq('user_id', userId);

    if (chatError) throw chatError;

    // Get user's purchase history
    const { data: purchaseStats, error: purchaseError } = await supabase
      .from('purchases')
      .select('product_id, amount, created_at')
      .eq('user_id', userId);

    if (purchaseError) throw purchaseError;

    // Calculate insights
    const insights = {
      totalChats: chatStats.length,
      totalSpent: purchaseStats.reduce((sum, p) => sum + p.amount, 0),
      mostUsedProduct: getMostFrequent(chatStats.map(c => c.product_id)),
      averageSessionLength: calculateAverageSessionLength(chatStats),
      usageTrend: calculateUsageTrend(chatStats),
      purchaseHistory: purchaseStats
    };

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product Analytics
router.get('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product usage statistics
    const { data: usageStats, error: usageError } = await supabase
      .from('chat_history')
      .select('user_id, created_at')
      .eq('product_id', productId);

    if (usageError) throw usageError;

    // Get review statistics
    const { data: reviewStats, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (reviewError) throw reviewError;

    const insights = {
      totalUsers: new Set(usageStats.map(u => u.user_id)).size,
      averageRating: reviewStats.reduce((acc, r) => acc + r.rating, 0) / reviewStats.length,
      usageTrend: calculateUsageTrend(usageStats),
      userRetention: calculateUserRetention(usageStats),
      dailyActiveUsers: calculateUsageTrend(usageStats)
    };

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 