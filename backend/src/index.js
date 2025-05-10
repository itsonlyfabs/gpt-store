require('dotenv').config()
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const paymentsRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const reviewsRoutes = require('./routes/reviews');
const userRoutes = require('./routes/user');
const bundlesRoutes = require('./routes/bundles');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Global logging middleware
app.use((req, res, next) => {
  console.log('INCOMING:', req.method, req.url, 'Headers:', req.headers);
  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3002', // Local development frontend
  process.env.FRONTEND_URL, // Production frontend URL
  'https://gpt-store.vercel.app', // Vercel default domain
  'https://gpt-store-mauve.vercel.app', // Additional Vercel domain
];

console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin, allowing request');
      return callback(null, true);
    }
    
    // Allow any subdomain of vercel.app in production
    if (process.env.NODE_ENV === 'production' && origin.endsWith('.vercel.app')) {
      console.log('Vercel domain detected, allowing request');
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode, allowing request');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin not in allowed list');
      return callback(new Error('Not allowed by CORS'));
    }
    
    console.log('Origin allowed');
    return callback(null, true);
  },
  credentials: true
}));

// Parse JSON payloads for all routes except /api/payments/webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bundles', bundlesRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${process.env.PORT || 3000}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});