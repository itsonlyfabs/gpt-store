const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all templates for a product
router.get('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // For development, return mock data
    const templates = [{
      id: '1',
      name: 'Sample Template',
      description: 'A sample template for testing',
      productId,
      url: 'mock-url',
      createdAt: new Date().toISOString()
    }];
    
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get a specific template
router.get('/:productId/:templateId', authMiddleware, async (req, res) => {
  try {
    const { productId, templateId } = req.params;
    
    // For development, return mock data
    const template = {
      id: templateId,
      name: 'Sample Template',
      description: 'A sample template for testing',
      productId,
      url: 'mock-url',
      createdAt: new Date().toISOString()
    };
    
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Upload a template
router.post('/:productId/upload', authMiddleware, upload.single('template'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No template file provided' });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomString}${path.extname(req.file.originalname)}`;

    // In development mode, save to local mock storage
    if (process.env.NODE_ENV === 'development') {
      const mockStorageDir = path.join(__dirname, '../../mock-storage', productId);
      await fs.mkdir(mockStorageDir, { recursive: true });

      const template = {
        id: filename,
        name: name || 'Untitled Template',
        description: description || '',
        productId,
        contentType: req.file.mimetype,
        createdAt: new Date().toISOString(),
        content: req.file.buffer.toString('base64')
      };

      // Save template metadata
      const templatesFile = path.join(mockStorageDir, 'templates.json');
      let templates = [];
      try {
        const data = await fs.readFile(templatesFile, 'utf8');
        templates = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
      }
      templates.push(template);
      await fs.writeFile(templatesFile, JSON.stringify(templates, null, 2));

      res.status(201).json(template);
    } else {
      // Production mode would handle S3 upload here
      res.status(500).json({ error: 'Production upload not implemented' });
    }
  } catch (error) {
    console.error('Upload template error:', error);
    res.status(500).json({ error: 'Failed to upload template' });
  }
});

module.exports = router;