const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

// Get reviews with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { productId, bundleId, page = 1, limit = 10, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: false })
      .range(offset, offset + limit - 1);
    if (productId) query = query.eq('product_id', productId);
    if (bundleId) query = query.eq('bundle_id', bundleId);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({
      reviews: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add review (no auth required for admin/manual entry)
router.post('/', async (req, res) => {
  try {
    const { productId, bundleId, rating, comment, reviewer_name } = req.body;
    if (!productId && !bundleId) {
      return res.status(400).json({ error: 'Must provide productId or bundleId' });
    }
    if (productId && bundleId) {
      return res.status(400).json({ error: 'Cannot provide both productId and bundleId' });
    }
    const insertObj = {
      user_id: null, // Admin/manual review
      rating: Math.round(rating), // Force integer
      comment,
      reviewer_name
    };
    if (productId) insertObj.product_id = productId;
    if (bundleId) insertObj.bundle_id = bundleId;
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([insertObj])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update review (no auth required for admin/manual entry)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, reviewer_name } = req.body;
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ rating: Math.round(rating), comment, reviewer_name }) // Force integer
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/reviews/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete review (no auth required for admin/manual entry)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/reviews/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 