const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all tenants
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tenants');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get layouts for a tenant
router.get('/:tenantId/layouts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM layouts WHERE tenant_id = ?', [req.params.tenantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save layout
router.post('/:tenantId/layouts', async (req, res) => {
  const { name, data } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO layouts (tenant_id, name, data) VALUES (?, ?, ?)',
      [req.params.tenantId, name, JSON.stringify(data)]
    );
    res.json({ id: result.insertId, message: 'Layout saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
