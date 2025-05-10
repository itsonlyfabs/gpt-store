const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../lib/supabase');

// Get reviews with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { productId, page = 1, limit = 10, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (name, avatar_url)
      `, { count: 'exact' })
      .eq('product_id', productId)
      .order(sort, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      reviews: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add review with validation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user has purchased the product
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (purchaseError || !purchase) {
      return res.status(403).json({ error: 'You must purchase the product to review it' });
    }

    // Check if user already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: userId,
        product_id: productId,
        rating,
        comment
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (reviewError) throw reviewError;
    if (!review || review.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, comment })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (reviewError) throw reviewError;
    if (!review || review.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 