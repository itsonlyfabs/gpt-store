const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../lib/supabase');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    if (error) throw error;
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

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router; 