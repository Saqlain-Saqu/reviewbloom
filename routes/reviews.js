import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// Get reviews for a product (public - shown on store)
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const { shop } = req.query;

  try {
    const result = await pool.query(`
      SELECT id, customer_name, rating, title, body, language, helpful_count, created_at
      FROM reviews
      WHERE product_id = $1 AND shop = $2 AND status = 'approved'
      ORDER BY created_at DESC
    `, [productId, shop]);

    // Calculate stats
    const reviews = result.rows;
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => ratingCounts[r.rating]++);

    res.json({ reviews, stats: { totalReviews, avgRating, ratingCounts } });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Submit a review (public)
router.post('/submit', async (req, res) => {
  const { shop, product_id, product_title, order_id, customer_name, customer_email, rating, title, body, language } = req.body;

  if (!shop || !product_id || !customer_name || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if already reviewed
    if (order_id) {
      const existing = await pool.query(
        'SELECT id FROM reviews WHERE order_id = $1 AND product_id = $2',
        [order_id, product_id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Already reviewed' });
      }
    }

    // Get store settings for auto-approve
    const storeResult = await pool.query('SELECT * FROM stores WHERE shop = $1', [shop]);
    const store = storeResult.rows[0];
    const status = 'approved';

    await pool.query(`
      INSERT INTO reviews (shop, product_id, product_title, order_id, customer_name, customer_email, rating, title, body, language, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [shop, product_id, product_title, order_id, customer_name, customer_email, rating, title, body, language || 'english', status]);

    res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

export default router;
