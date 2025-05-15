const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');

// Public: Get all documentation
router.get('/', async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] [documentation.js] Incoming request headers:`, req.headers);
  const { data, error } = await supabaseAdmin.from('documentation').select('*').order('created_at', { ascending: false });
  console.log(`[${now}] [documentation.js] Returning ${data ? data.length : 0} documentation rows`);
  console.log(`[${now}] [documentation.js] Data:`, data);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Public: Get a single documentation article by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('documentation').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

module.exports = router; 