const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatWithAI } = require('../services/aiService');
const { createClient } = require('@supabase/supabase-js');

// Log all requests to the chat router
router.use((req, res, next) => {
  console.log('CHAT ROUTER REQUEST:', req.method, req.originalUrl, 'BODY:', req.body);
  next();
});

// Helper to get Supabase client with user's JWT
function getSupabaseClientWithUserJWT(req) {
  const authHeader = req.headers.authorization;
  const jwt = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
}

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

// --- Team Chat: Generate Summary ---
router.post('/generate-summary', authMiddleware, async (req, res) => {
  console.log('BODY RECEIVED:', req.body);
  let sessionId = req.body.session_id || req.body.sessionId;
  console.log('generate-summary called with sessionId:', sessionId);
  const userId = req.user.id;
  const supabase = getSupabaseClientWithUserJWT(req);
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  // Fetch last 50 messages for summary (match either session_id or conversation_id)
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('role, content, product_id')
    .or(`session_id.eq.${sessionId},conversation_id.eq.${sessionId}`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: 'Failed to fetch messages' });

  // Fetch the session to include team goal (like single product logic)
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('team_goal')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) {
    console.error('Error fetching session for summary:', sessionError);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }

  // Use OpenAI to generate the summary (like single product logic)
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not set' });
  }

  // Create a summary prompt (like single product logic)
  const summaryPrompt = `Please provide a very concise summary (maximum 100 words) of the following chat history. Focus on key points, decisions, and requirements mentioned by the user. The summary should be a short snippet, not a full explanation.\nTeam Goal: ${session.team_goal || 'Not specified'}\n\nChat History:\n${messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}\n\nSummary:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';
    // Store summary
    await supabase.from('chat_summaries').insert({ session_id: sessionId, user_id: userId, content: summary });
    res.json({ summary });
  } catch (e) {
    console.error('Error generating summary:', e);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// --- Team Chat: Ask the Team ---
router.post('/ask-the-team', authMiddleware, async (req, res) => {
  const { sessionId, message } = req.body;
  const userId = req.user.id;
  const supabase = getSupabaseClientWithUserJWT(req);
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });
  // Get all products in session (simulate: fetch from chat history)
  const { data: products } = await supabase
    .from('chat_messages')
    .select('product_id')
    .eq('conversation_id', sessionId)
    .neq('product_id', null);
  const uniqueProducts = [...new Set((products || []).map(p => p.product_id))];
  // Ask each product (simulate: just echo for now)
  const responses = await Promise.all(uniqueProducts.map(async (productId) => {
    // Here you would call chatWithAI for each product
    return { productId, content: `Response from ${productId} to: ${message}` };
  }));
  // Store responses
  for (const r of responses) {
    await supabase.from('team_responses').insert({ session_id: sessionId, product_id: r.productId, content: r.content });
  }
  // Simple summary
  const summary = responses.map(r => `${r.productId}: ${r.content}`).join('\n');
  res.json({ responses, summary });
});

// --- Team Chat: Set Team Goal ---
router.post('/set-team-goal', authMiddleware, async (req, res) => {
  const { sessionId, teamGoal } = req.body;
  const userId = req.user.id;
  const supabase = getSupabaseClientWithUserJWT(req);
  if (!sessionId || !teamGoal) return res.status(400).json({ error: 'sessionId and teamGoal required' });
  const { error } = await supabase
    .from('chat_sessions')
    .update({ team_goal: teamGoal })
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: 'Failed to set team goal' });
  res.json({ success: true });
});

// --- Team Chat: Context Transfer on Product Switch ---
router.post('/switch-product', authMiddleware, async (req, res) => {
  console.log('SWITCH PRODUCT BODY (top of handler):', req.body); // Debug log
  const { sessionId, toProductId } = req.body;
  const userId = req.user.id;
  const supabase = getSupabaseClientWithUserJWT(req);
  if (!sessionId || !toProductId) return res.status(400).json({ error: 'sessionId and toProductId required' });
  // Get current active product
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('active_product_id, team_goal')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  const fromProductId = session?.active_product_id;
  // Get last 10 messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('content, role')
    .eq('conversation_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10);
  // Create summary
  const summary = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  // Store context transfer
  await supabase.from('context_transfers').insert({ session_id: sessionId, from_product_id: fromProductId, to_product_id: toProductId, summary });
  // Update active product
  await supabase.from('chat_sessions').update({ active_product_id: toProductId, last_context_transfer_at: new Date().toISOString() }).eq('id', sessionId);
  res.json({ success: true, summary });
});

// --- Team Chat: Get Session Info, Products, Messages, Notes, Summaries ---
router.get('/:id', authMiddleware, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const supabase = getSupabaseClientWithUserJWT(req);
  try {
    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });
    // Get products in this session (simulate: all products for now)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, assistant_id');
    // Get messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', sessionId)
      .order('created_at', { ascending: true });
    // Get notes
    const { data: notes } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    // Get summaries
    const { data: summaries } = await supabase
      .from('chat_summaries')
      .select('id, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    console.log('GET SESSION MESSAGES:', { sessionId, messages });
    res.json({ session, products, messages, notes, summaries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session info' });
  }
});

// --- Chat endpoint (must be last!) ---
router.post('/:productId', authMiddleware, async (req, res) => {
  console.log('POST CHAT PRODUCT:', req.params.productId, 'BODY:', req.body);
  try {
    const { productId } = req.params;
    const { message, conversationId } = req.body;
    const userId = req.user.id;
    const supabase = getSupabaseClientWithUserJWT(req);

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message is required' });
    }

    // Check rate limit (per minute, for abuse prevention)
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    // --- Monthly request quota logic ---
    // 1. Get current month string (YYYY-MM)
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 2. Fetch or create user_requests row for this user/month
    let { data: userRequest, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
      return res.status(500).json({ error: 'Failed to check usage quota' });
    }

    // 3. Determine tier and limit
    let tier = 'free';
    let limit = 150;
    if (userRequest && userRequest.tier === 'pro') {
      tier = 'pro';
      limit = 500;
    }

    // 4. If no row, create it
    if (!userRequest) {
      const { data: newRow, error: insertError } = await supabase
        .from('user_requests')
        .insert({ user_id: userId, month, request_count: 0, tier })
        .select()
        .single();
      if (insertError) {
        console.error('Insert error (user_requests):', insertError);
        return res.status(500).json({ error: 'Failed to initialize usage quota', details: insertError });
      }
      userRequest = newRow;
    }

    // 5. Enforce limit
    if (userRequest.request_count >= limit) {
      return res.status(403).json({
        error: `You've hit your limit of ${limit} requests for this month. Upgrade to Pro for more!`,
        limit,
        tier,
        reset: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      });
    }

    // 6. Increment request count
    const { error: updateError } = await supabase
      .from('user_requests')
      .update({ request_count: userRequest.request_count + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('month', month);
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update usage quota' });
    }
    // --- End quota logic ---

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
          session_id: convId,
          role: 'user',
          content: message
        },
        {
          user_id: userId,
          product_id: productId,
          conversation_id: convId,
          session_id: convId,
          role: 'assistant',
          content: response.content
        }
      ]);
    console.log('STORED CHAT MESSAGES:', { convId, message, assistant: response.content });

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
    const supabase = getSupabaseClientWithUserJWT(req);

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

// In the POST /api/chat/:id endpoint, handle reset with .or for deletion
router.post('/:productId', authMiddleware, async (req, res) => {
  // ... existing code ...
  // Handle reset
  if (req.body.reset) {
    let sessionId = req.body.session_id || req.body.sessionId || req.params.productId;
    console.log('RESETTING chat for sessionId:', sessionId);
    const supabase = getSupabaseClientWithUserJWT(req);
    await supabase
      .from('chat_messages')
      .delete()
      .or(`session_id.eq.${sessionId},conversation_id.eq.${sessionId}`);
    return res.json({ success: true });
  }
  // ... existing code ...
});

module.exports = router; 