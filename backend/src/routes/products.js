const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../lib/supabase');

// Get all products with full-text search and filters
router.get('/', async (req, res) => {
  try {
    const { search, category, tier, sort, limit } = req.query;
    let query = supabaseAdmin.from('products').select('*');

    // Full-text search
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Tier filter
    if (tier) {
      query = query.eq('tier', tier);
    }

    // Sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else {
      // Default: most relevant (let's use created_at desc for now)
      query = query.order('created_at', { ascending: false });
    }

    let { data: products, error } = await query;
    if (error) throw error;

    // Limit results if requested
    if (limit) {
      products = products.slice(0, parseInt(limit, 10));
    }

    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product (admin only, open for now)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      thumbnail,
      features,
      assistant_id,
      tier // 'FREE' or 'PRO'
    } = req.body;

    // Basic validation
    if (!name || !description || !category || !thumbnail || !assistant_id || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          name,
          description,
          category,
          thumbnail,
          features: Array.isArray(features) ? features : [],
          assistant_id,
          tier
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router; 