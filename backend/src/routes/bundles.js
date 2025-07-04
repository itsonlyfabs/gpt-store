const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');

// Create a new bundle
router.post('/', async (req, res) => {
  try {
    const { name, description, image, productIds, tier, is_admin } = req.body;
    if (!name || !description || !image || !Array.isArray(productIds) || productIds.length === 0 || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Always set is_admin: true for admin dashboard
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .insert([
        { name, description, image, tier, is_admin: true }
      ])
      .select()
      .single();
    if (bundleError) throw bundleError;
    // Insert into bundle_products
    let products = [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      const bundleProductRows = productIds.map(pid => ({ bundle_id: bundle.id, product_id: pid }));
      await supabaseAdmin
        .from('bundle_products')
        .insert(bundleProductRows);
      // Fetch products for this bundle
      const { data: fetchedProducts } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', productIds);
      products = fetchedProducts || [];
    }
    res.status(201).json({ ...bundle, products });
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

// Update a bundle
router.put('/:id', async (req, res) => {
  try {
    const { id, name, description, image, tier, product_ids } = req.body;
    if (!id || !name || !description || !image || !tier || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Always set is_admin: true for admin dashboard edits
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .update({ name, description, image, tier, is_admin: true })
      .eq('id', id)
      .select()
      .single();
    if (bundleError) {
      console.error('Supabase error in bundle update:', bundleError);
      throw bundleError;
    }
    // Update bundle_products join table
    await supabaseAdmin
      .from('bundle_products')
      .delete()
      .eq('bundle_id', id);
    let products = [];
    if (Array.isArray(product_ids) && product_ids.length > 0) {
      const bundleProductRows = product_ids.map(pid => ({ bundle_id: id, product_id: pid }));
      await supabaseAdmin
        .from('bundle_products')
        .insert(bundleProductRows);
      // Fetch products for this bundle
      const { data: fetchedProducts } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', product_ids);
      products = fetchedProducts || [];
    }
    res.json({ ...bundle, products });
  } catch (error) {
    console.error('Bundle update error:', error);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
});

module.exports = router; 