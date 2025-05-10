const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { supabase } = require('../lib/supabase');

// Product Management
router.put('/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/products/:id - Request body:', req.body);
    console.log('User:', req.user);
    
    const { id } = req.params;
    const { name, description, price, currency, category } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({ name, description, price, currency, category })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error in product update:', error);
      throw error;
    }
    console.log('Product updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/products/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('DELETE /api/admin/products/:id - Product ID:', req.params.id);
    console.log('User:', req.user);
    
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error in product deletion:', error);
      throw error;
    }
    console.log('Product deleted successfully');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/products/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Management
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('GET /api/admin/users - Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });
    console.log('User from auth middleware:', req.user);
    console.log('Session:', req.session);

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, user_profiles(role)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in users fetch:', error);
      throw error;
    }

    // Flatten the role field for each user
    const usersWithRole = data.map(user => ({
      ...user,
      role: user.user_profiles?.role || 'user',
    }));

    console.log('Successfully fetched users:', {
      count: usersWithRole.length,
      firstUser: usersWithRole[0] // Log first user as sample
    });

    res.json(usersWithRole);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/status', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/users/:id/status - Request:', {
      userId: req.params.id,
      status: req.body.status,
      user: req.user
    });
    
    const { id } = req.params;
    const { status } = req.body; // 'active', 'suspended', 'banned'
    
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error in user status update:', error);
      throw error;
    }
    console.log('User status updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 