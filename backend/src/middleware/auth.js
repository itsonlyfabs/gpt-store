const { supabase } = require('../config/supabase');

const isDevelopment = process.env.NODE_ENV === 'development';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // In development mode, accept a special development token
    if (isDevelopment && token === 'dev_token') {
      req.user = {
        id: 'dev_user_id',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware; 