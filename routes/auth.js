import express from 'express';
import crypto from 'crypto';
import pool from '../database/db.js';

const router = express.Router();

// Install route
router.get('/install', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Shop parameter required');

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const scopes = process.env.SCOPES;
  const apiKey = process.env.SHOPIFY_API_KEY;
  const state = crypto.randomBytes(16).toString('hex');

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  res.redirect(installUrl);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { shop, code, hmac, state } = req.query;

  try {
    // Get access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get shop info
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    const shopData = await shopResponse.json();
    const shopEmail = shopData.shop?.email || '';

    // Save to database
    await pool.query(`
      INSERT INTO stores (shop, access_token, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (shop) DO UPDATE SET
        access_token = $2,
        email = $3,
        updated_at = NOW()
    `, [shop, accessToken, shopEmail]);

    // Register webhook for orders
    await registerWebhooks(shop, accessToken);

    // Install script tag
    await installScriptTag(shop, accessToken);

    res.redirect(`/?shop=${shop}&token=${accessToken}`);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

async function registerWebhooks(shop, token) {
  const webhooks = [
    { topic: 'orders/fulfilled', address: `${process.env.SHOPIFY_APP_URL}/webhooks/order-fulfilled` }
  ];

  for (const webhook of webhooks) {
    try {
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ webhook })
      });
    } catch (e) {
      console.error('Webhook registration error:', e);
    }
  }
}

async function installScriptTag(shop, token) {
  try {
    await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: `${process.env.SHOPIFY_APP_URL}/widget/reviewbloom.js`,
          display_scope: 'all'
        }
      })
    });
  } catch (e) {
    console.error('Script tag error:', e);
  }
}

export default router;
