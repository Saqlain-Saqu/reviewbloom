import express from 'express';
import pool from '../database/db.js';
import { sendReviewEmail } from '../utils/email.js';

const router = express.Router();

// Order fulfilled webhook
router.post('/order-fulfilled', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  const order = req.body;

  res.status(200).send('OK'); // Respond quickly

  try {
    const storeResult = await pool.query('SELECT * FROM stores WHERE shop = $1', [shop]);
    const store = storeResult.rows[0];

    if (!store || !store.auto_email) return;

    const customerEmail = order.email;
    const customerName = order.billing_address?.first_name || order.customer?.first_name || 'Customer';
    const products = order.line_items || [];

    if (!customerEmail) return;

    // Schedule email
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + (store.email_delay_days || 3));

    await pool.query(`
      INSERT INTO email_queue (shop, order_id, customer_email, customer_name, product_ids, product_titles, scheduled_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      shop,
      order.id.toString(),
      customerEmail,
      customerName,
      products.map(p => p.product_id).join(','),
      products.map(p => p.title).join('||'),
      scheduledAt
    ]);

    // Send immediately if delay is 0
    if (store.email_delay_days === 0) {
      await sendReviewEmail(store, customerEmail, customerName, products, order.id);
    }

  } catch (error) {
    console.error('Webhook error:', error);
  }
});

export default router;
