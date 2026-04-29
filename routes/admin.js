import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// Get all reviews for admin
router.get('/reviews', async (req, res) => {
  const { shop, status, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM reviews WHERE shop = $1';
    let params = [shop];

    if (status && status !== 'all') {
      query += ' AND status = $2';
      params.push(status);
      query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
      params.push(limit, offset);
    } else {
      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);

    // Get counts
    const counts = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) as total
      FROM reviews WHERE shop = $1
    `, [shop]);

    res.json({ reviews: result.rows, counts: counts.rows[0] });
  } catch (error) {
    console.error('Admin reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Approve review
router.put('/reviews/:id/approve', async (req, res) => {
  try {
    await pool.query(
      "UPDATE reviews SET status = 'approved', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// Reject review
router.put('/reviews/:id/reject', async (req, res) => {
  try {
    await pool.query(
      "UPDATE reviews SET status = 'rejected', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// Delete review
router.delete('/reviews/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Get store settings
router.get('/settings', async (req, res) => {
  const { shop } = req.query;
  try {
    const result = await pool.query('SELECT * FROM stores WHERE shop = $1', [shop]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update store settings
router.put('/settings', async (req, res) => {
  const { shop, language, auto_email, email_delay_days, widget_theme, accent_color } = req.body;
  try {
    await pool.query(`
      UPDATE stores SET
        language = $2,
        auto_email = $3,
        email_delay_days = $4,
        widget_theme = $5,
        accent_color = $6,
        updated_at = NOW()
      WHERE shop = $1
    `, [shop, language, auto_email, email_delay_days, widget_theme, accent_color]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  const { shop } = req.query;
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
      FROM reviews WHERE shop = $1
    `, [shop]);
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
