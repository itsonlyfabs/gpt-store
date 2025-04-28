const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Mock reviews storage for development
const reviews = new Map();

// Helper to get reviews for a product
const getProductReviews = (productId) => {
  return Array.from(reviews.values()).filter(review => review.productId === productId);
};

// Get reviews for a product
router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const productReviews = getProductReviews(productId);
    
    res.json({
      reviews: productReviews,
      total: productReviews.length,
      averageRating: productReviews.length > 0
        ? productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length
        : 0
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add a new review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Product ID and rating (1-5) are required' 
      });
    }

    // Check if user has already reviewed this product
    const existingReview = Array.from(reviews.values()).find(
      review => review.userId === userId && review.productId === productId
    );

    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this product' 
      });
    }

    // Create new review
    const review = {
      id: Date.now().toString(),
      userId,
      productId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      userName: req.user.name || 'Anonymous' // In production, fetch from user profile
    };

    // Store review
    reviews.set(review.id, review);

    res.status(201).json(review);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = reviews.get(id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Update review
    const updatedReview = {
      ...review,
      rating: rating || review.rating,
      comment: comment || review.comment,
      updatedAt: new Date().toISOString()
    };

    reviews.set(id, updatedReview);

    res.json(updatedReview);
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the review
    const review = reviews.get(id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Delete review
    reviews.delete(id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router; 