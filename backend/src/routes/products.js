const express = require('express');
const router = express.Router();

// Mock products for development
const products = [
  {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'An AI-powered tool to help you maintain focus and concentration during work sessions.',
    price: 2999, // $29.99
    category: 'Focus & Concentration',
    thumbnail: 'https://picsum.photos/seed/focus/800/400',
    priceType: 'subscription',
    currency: 'USD',
    features: [
      'Real-time focus tracking',
      'Personalized concentration exercises',
      'Break time recommendations',
      'Progress analytics'
    ],
    sampleInteractions: [
      {
        question: 'How can I stay focused during long work sessions?',
        answer: 'I can help you implement the Pomodoro Technique with personalized timing based on your focus patterns.'
      }
    ]
  },
  {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation sessions with AI-guided breathing exercises and mindfulness techniques.',
    price: 1999, // $19.99
    category: 'Meditation & Mindfulness',
    thumbnail: 'https://picsum.photos/seed/meditation/800/400',
    priceType: 'subscription',
    currency: 'USD',
    features: [
      'Guided meditation sessions',
      'Breathing exercises',
      'Sleep stories',
      'Stress reduction techniques'
    ],
    sampleInteractions: [
      {
        question: 'I\'m feeling stressed about work',
        answer: 'Let\'s start with a quick 5-minute breathing exercise to help you center yourself.'
      }
    ]
  },
  {
    id: '3',
    name: 'Productivity Booster AI',
    description: 'AI-driven productivity assistant that helps you manage tasks, time, and goals effectively.',
    price: 3999, // $39.99
    category: 'Productivity',
    thumbnail: 'https://picsum.photos/seed/productivity/800/400',
    priceType: 'one_time',
    currency: 'USD',
    features: [
      'Smart task prioritization',
      'Time tracking analytics',
      'Goal setting assistance',
      'Progress reporting'
    ],
    sampleInteractions: [
      {
        question: 'How can I better manage my daily tasks?',
        answer: 'Let\'s analyze your task list and create a prioritized schedule based on urgency and importance.'
      }
    ]
  },
  {
    id: '4',
    name: 'Personal Growth Coach AI',
    description: 'Your AI companion for personal development, helping you achieve your goals and develop new skills.',
    price: 4999, // $49.99
    category: 'Personal Development',
    thumbnail: 'https://picsum.photos/seed/growth/800/400',
    priceType: 'subscription',
    currency: 'USD',
    features: [
      'Personalized growth plans',
      'Skill development tracking',
      'Regular progress assessments',
      'Habit formation guidance'
    ],
    sampleInteractions: [
      {
        question: 'How can I develop better habits?',
        answer: 'I\'ll help you create a habit formation plan using the proven 21-day method, with daily check-ins and adjustments.'
      }
    ]
  }
];

// Helper function to search products
const searchProducts = (query, productsToSearch) => {
  const searchTerms = query.toLowerCase().split(' ');
  return productsToSearch.filter(product => {
    const searchableText = `
      ${product.name.toLowerCase()}
      ${product.description.toLowerCase()}
      ${product.category.toLowerCase()}
      ${product.features.join(' ').toLowerCase()}
    `;
    return searchTerms.every(term => searchableText.includes(term));
  });
};

// Get all products
router.get('/', (req, res) => {
  try {
    const { category, priceType, currency, search } = req.query;
    
    let filteredProducts = [...products];
    
    // Apply search filter first if present
    if (search) {
      filteredProducts = searchProducts(search, filteredProducts);
    }
    
    // Apply other filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (priceType) {
      filteredProducts = filteredProducts.filter(p => p.priceType === priceType);
    }
    if (currency) {
      filteredProducts = filteredProducts.filter(p => p.currency === currency);
    }
    
    res.json(filteredProducts);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router; 