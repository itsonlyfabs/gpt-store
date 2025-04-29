const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const paymentsRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const reviewsRoutes = require('./routes/reviews');
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3002', // Local development
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
    
    // Allow any subdomain of vercel.app
    if (origin.endsWith('.vercel.app')) {
      console.log('Vercel domain detected, allowing request');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin not in allowed list');
      // For now, allow all origins
      return callback(null, true);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});