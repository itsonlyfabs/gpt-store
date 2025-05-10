const { supabase } = require('../lib/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('[authMiddleware] Authorization header:', authHeader);
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[authMiddleware] No Bearer token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[authMiddleware] Extracted token:', token);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('[authMiddleware] Supabase user:', user, 'Error:', error);

    if (error || !user) {
      console.error('[authMiddleware] Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email
    };
    console.log('[authMiddleware] User attached to request:', req.user);
    next();
  } catch (error) {
    console.error('[authMiddleware] Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware; 