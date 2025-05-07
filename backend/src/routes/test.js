const express = require('express');
const router = express.Router();
const AppError = require('../utils/errors');

// Test route for 404
router.get('/not-found', (req, res, next) => {
  next(new AppError('Resource not found', 404));
});

// Test route for 400
router.get('/bad-request', (req, res, next) => {
  next(new AppError('Invalid request', 400));
});

// Test route for 500
router.get('/server-error', (req, res, next) => {
  throw new Error('Unexpected server error');
});

module.exports = router; 