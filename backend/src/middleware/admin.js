const { supabase } = require('../lib/supabase');

const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log('[adminMiddleware] Checking admin for userId:', userId);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('[adminMiddleware] Supabase user_profiles result:', data, 'Error:', error);

    if (error) throw error;

    if (!data || data.role !== 'admin') {
      console.log('[adminMiddleware] Access denied. User is not admin:', data);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('[adminMiddleware] Admin middleware error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = adminMiddleware; 