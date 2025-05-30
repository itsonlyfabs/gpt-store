const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');

// Create a new bundle
router.post('/', async (req, res) => {
  try {
    const { name, description, image, productIds } = req.body;
    if (!name || !description || !image || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabaseAdmin
      .from('bundles')
      .insert([
        {
          name,
          description,
          image,
          product_ids: productIds,
        }
      ])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Bundle creation error:', error);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

// List all bundles
router.get('/', async (req, res) => {
  try {
    const { search, limit } = req.query;
    // Fetch all bundles
    const { data: bundles, error: bundlesError } = await supabaseAdmin
      .from('bundles')
      .select('*');
    if (bundlesError) throw bundlesError;

    // Fetch all products (for mapping)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*');
    if (productsError) throw productsError;

    // Attach product objects to each bundle
    let bundlesWithProducts = bundles.map(bundle => ({
      ...bundle,
      products: (bundle.product_ids || []).map(pid => products.find(p => p.id === pid)).filter(Boolean)
    }));

    // Filter by search query (name, case-insensitive)
    if (search) {
      const searchLower = search.toLowerCase();
      bundlesWithProducts = bundlesWithProducts.filter(b => b.name && b.name.toLowerCase().includes(searchLower));
    }

    // Limit results if requested
    if (limit) {
      bundlesWithProducts = bundlesWithProducts.slice(0, parseInt(limit, 10));
    }

    res.json(bundlesWithProducts);
  } catch (error) {
    console.error('Bundles fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

module.exports = router; 