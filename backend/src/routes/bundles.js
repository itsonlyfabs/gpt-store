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
    const { data, error } = await supabaseAdmin
      .from('bundles')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Bundles fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

module.exports = router; 