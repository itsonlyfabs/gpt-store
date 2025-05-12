const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { supabase, supabaseAdmin } = require('../lib/supabase');

// Product Management
router.put('/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/products/:id - Request body:', req.body);
    console.log('User:', req.user);
    const { id } = req.params;
    const { name, description, price, currency, category, thumbnail, price_type, features, assistant_id } = req.body;
    const updatePayload = { name, description, price, currency, category, thumbnail, price_type, features, assistant_id };
    console.log('Update payload:', updatePayload);
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select();
    if (error) {
      console.error('Supabase error in product update:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.error('No product found to update for id:', id);
      return res.status(404).json({ error: 'Product not found' });
    }
    if (data.length > 1) {
      console.error('Multiple products updated for id:', id);
      return res.status(500).json({ error: 'Multiple products updated, expected one.' });
    }
    console.log('Product updated successfully:', data[0]);
    res.json(data[0]);
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
    const { error } = await supabaseAdmin
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

router.get('/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET /api/admin/products/:id - Looking for product with id:', id);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Supabase error in product fetch:', error);
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('Product found:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/products/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products (admin only)
router.get('/products', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('GET /api/admin/products - User:', req.user);
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*');
    if (error) {
      console.error('Supabase error in products fetch:', error);
      throw error;
    }
    console.log('Products fetched successfully:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new product (admin only)
router.post('/products', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('POST /api/admin/products - Request body:', req.body);
    console.log('User:', req.user);
    const {
      name,
      description,
      price,
      category,
      thumbnail,
      price_type,
      currency,
      features,
      assistant_id
    } = req.body;

    // Basic validation
    if (!name || !description || !price || !category || !thumbnail || !price_type || !currency || !assistant_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          name,
          description,
          price,
          category,
          thumbnail,
          price_type,
          currency,
          features: features || [],
          assistant_id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error in product creation:', error);
      throw error;
    }
    console.log('Product created successfully:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);
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
      .from('user_profiles')
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

router.put('/users/:id/role', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/users/:id/role - Request:', {
      userId: req.params.id,
      role: req.body.role,
      user: req.user
    });
    const { id } = req.params;
    const { role } = req.body; // 'admin' or 'user'
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Supabase error in user role update:', error);
      throw error;
    }
    console.log('User role updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/role:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/subscription', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/users/:id/subscription - Request:', {
      userId: req.params.id,
      subscription: req.body.subscription,
      user: req.user
    });
    
    const { id } = req.params;
    const { subscription } = req.body;
    
    if (!['FREE', 'PRO'].includes(subscription)) {
      return res.status(400).json({ error: 'Invalid subscription type' });
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ subscription })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error in user subscription update:', error);
      throw error;
    }
    console.log('User subscription updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bundle Management
router.get('/bundles', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('GET /api/admin/bundles - User:', req.user);
    const { data: bundles, error } = await supabaseAdmin
      .from('bundles')
      .select('*');
    if (error) {
      console.error('Supabase error in bundles fetch:', error);
      throw error;
    }
    res.json(bundles);
  } catch (error) {
    console.error('Error in GET /api/admin/bundles:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bundles', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('POST /api/admin/bundles - Request body:', req.body);
    console.log('User:', req.user);
    const { name, description, image, product_ids } = req.body;

    // Basic validation
    if (!name || !description || !image || !product_ids || !Array.isArray(product_ids)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .insert([{ name, description, image, product_ids }])
      .select()
      .single();

    if (bundleError) {
      console.error('Supabase error in bundle creation:', bundleError);
      throw bundleError;
    }

    console.log('Bundle created successfully:', bundle);
    res.status(201).json(bundle);
  } catch (error) {
    console.error('Error in POST /api/admin/bundles:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/bundles/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('PUT /api/admin/bundles/:id - Request body:', req.body);
    console.log('User:', req.user);
    const { id } = req.params;
    const { name, description, image, product_ids } = req.body;

    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .update({ name, description, image, product_ids })
      .eq('id', id)
      .select()
      .single();

    if (bundleError) {
      console.error('Supabase error in bundle update:', bundleError);
      throw bundleError;
    }

    console.log('Bundle updated successfully:', bundle);
    res.json(bundle);
  } catch (error) {
    console.error('Error in PUT /api/admin/bundles/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bundles/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('DELETE /api/admin/bundles/:id - Bundle ID:', req.params.id);
    console.log('User:', req.user);
    const { id } = req.params;

    const { error: bundleError } = await supabaseAdmin
      .from('bundles')
      .delete()
      .eq('id', id);

    if (bundleError) {
      console.error('Supabase error in bundle deletion:', bundleError);
      throw bundleError;
    }

    console.log('Bundle deleted successfully');
    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/bundles/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 