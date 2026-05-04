import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// Widget JS file served to stores
router.get('/reviewbloom.js', async (req, res) => {
  const appUrl = process.env.SHOPIFY_APP_URL;

  const widgetJS = `
(function() {
  'use strict';
  
  const APP_URL = '${appUrl}';
  
  // Get shop from Shopify
  const shop = window.Shopify?.shop || window.location.hostname;
  
  // Translations
  const translations = {
    english: {
      title: 'Customer Reviews',
      writeReview: 'Write a Review',
      noReviews: 'No reviews yet. Be the first to review!',
      helpful: 'Helpful',
      rating: 'Rating',
      name: 'Your Name',
      email: 'Your Email',
      reviewTitle: 'Review Title',
      reviewBody: 'Write your review...',
      submit: 'Submit Review',
      thankYou: 'Thank you for your review!',
      stars: ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
    },
    urdu: {
      title: 'گاہک کے جائزے',
      writeReview: 'ریویو لکھیں',
      noReviews: 'ابھی تک کوئی ریویو نہیں۔ پہلے ریویو لکھیں!',
      helpful: 'مددگار',
      rating: 'درجہ بندی',
      name: 'آپ کا نام',
      email: 'آپ کی ای میل',
      reviewTitle: 'ریویو کا عنوان',
      reviewBody: 'اپنا ریویو لکھیں...',
      submit: 'ریویو جمع کریں',
      thankYou: 'آپ کے ریویو کا شکریہ!',
      stars: ['', 'خراب', 'ٹھیک', 'اچھا', 'بہت اچھا', 'بہترین']
    },
    hindi: {
      title: 'ग्राहक समीक्षाएं',
      writeReview: 'समीक्षा लिखें',
      noReviews: 'अभी तक कोई समीक्षा नहीं। पहली समीक्षा लिखें!',
      helpful: 'उपयोगी',
      rating: 'रेटिंग',
      name: 'आपका नाम',
      email: 'आपका ईमेल',
      reviewTitle: 'समीक्षा शीर्षक',
      reviewBody: 'अपनी समीक्षा लिखें...',
      submit: 'समीक्षा जमा करें',
      thankYou: 'आपकी समीक्षा के लिए धन्यवाद!',
      stars: ['', 'खराब', 'ठीक', 'अच्छा', 'बहुत अच्छा', 'उत्कृष्ट']
    }
  };

  async function getStoreSettings() {
    try {
      const res = await fetch(APP_URL + '/api/admin/settings?shop=' + shop);
      return await res.json();
    } catch(e) { return {}; }
  }

  async function getReviews(productId) {
    try {
      const res = await fetch(APP_URL + '/api/reviews/product/' + productId + '?shop=' + shop);
      return await res.json();
    } catch(e) { return { reviews: [], stats: { totalReviews: 0, avgRating: 0 } }; }
  }

  function renderStars(rating, interactive = false, size = 20) {
    let html = '<div class="rb-stars" style="display:flex;gap:2px;">';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      html += \`<span 
        class="rb-star \${interactive ? 'rb-star-interactive' : ''}" 
        data-value="\${i}"
        style="font-size:\${size}px;cursor:\${interactive ? 'pointer' : 'default'};color:\${filled ? '#f59e0b' : '#d1d5db'};"
      >★</span>\`;
    }
    html += '</div>';
    return html;
  }

  function renderWidget(container, data, settings, lang) {
    const t = translations[lang] || translations.english;
    const accentColor = settings.accent_color || '#10b981';
    const { reviews, stats } = data;
    const isDark = settings.widget_theme === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#ffffff';
    const textColor = isDark ? '#e8e8f0' : '#1a1a2e';
    const borderColor = isDark ? '#2a2a3d' : '#e5e7eb';

    const productId = container.dataset.productId;

    let html = \`
      <div class="reviewbloom-widget" style="
        font-family:'Segoe UI',system-ui,sans-serif;
        background:\${bgColor};
        color:\${textColor};
        border:1px solid \${borderColor};
        border-radius:16px;
        padding:32px;
        margin:32px 0;
      ">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
          <div>
            <h3 style="margin:0;font-size:22px;font-weight:700;">\${t.title}</h3>
            \${stats.totalReviews > 0 ? \`
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                \${renderStars(Math.round(stats.avgRating))}
                <span style="font-size:24px;font-weight:800;color:\${accentColor}">\${stats.avgRating}</span>
                <span style="color:#9ca3af;">(\${stats.totalReviews})</span>
              </div>
            \` : ''}
          </div>
          <button id="rb-write-btn" style="
            background:\${accentColor};
            color:white;
            border:none;
            padding:12px 24px;
            border-radius:10px;
            font-size:14px;
            font-weight:600;
            cursor:pointer;
          ">\${t.writeReview}</button>
        </div>

        <!-- Write Review Form (hidden by default) -->
        <div id="rb-form-container" style="display:none;background:\${isDark ? '#13131a' : '#f8fafc'};border-radius:12px;padding:24px;margin-bottom:24px;">
          <div id="rb-form-inner">
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;color:#9ca3af;">\${t.rating}</label>
              <div id="rb-rating-stars" style="display:flex;gap:4px;">
                \${[1,2,3,4,5].map(i => \`
                  <span class="rb-star-input" data-value="\${i}" style="font-size:36px;cursor:pointer;color:#d1d5db;transition:color 0.1s;">★</span>
                \`).join('')}
              </div>
              <span id="rb-rating-text" style="font-size:12px;color:#9ca3af;margin-top:4px;display:block;"></span>
            </div>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:12px;">
              <input id="rb-name" type="text" placeholder="\${t.name}" style="
                padding:12px;border:1px solid \${borderColor};border-radius:8px;    
                background:\${bgColor};color:\${textColor};font-size:14px;outline:none;
              "/>
              <input id="rb-email" type="email" placeholder="\${t.email}" style="
                padding:12px;border:1px solid \${borderColor};border-radius:8px;
                background:\${bgColor};color:\${textColor};font-size:14px;outline:none;
              "/>
            </div>
            <input id="rb-title" type="text" placeholder="\${t.reviewTitle}" style="
              width:100%;padding:12px;border:1px solid \${borderColor};border-radius:8px;
              background:\${bgColor};color:\${textColor};font-size:14px;outline:none;margin-bottom:12px;box-sizing:border-box;
            "/>
            <textarea id="rb-body" placeholder="\${t.reviewBody}" rows="4" style="
              width:100%;padding:12px;border:1px solid \${borderColor};border-radius:8px;
              background:\${bgColor};color:\${textColor};font-size:14px;outline:none;resize:vertical;box-sizing:border-box;
            "></textarea>
            <div style="display:flex;gap:12px;margin-top:16px;">
              <button id="rb-submit" style="
                flex:1;background:\${accentColor};color:white;border:none;padding:12px;
                border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;
              ">\${t.submit}</button>
              <button id="rb-cancel" style="
                padding:12px 20px;background:transparent;border:1px solid \${borderColor};
                color:\${textColor};border-radius:8px;cursor:pointer;font-size:14px;
              ">✕</button>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div id="rb-reviews-list">
          \${reviews.length === 0 ? \`
            <div style="text-align:center;padding:40px;color:#9ca3af;">
              <div style="font-size:48px;margin-bottom:16px;">🌸</div>
              <p style="margin:0;">\${t.noReviews}</p>
            </div>
          \` : reviews.map(r => \`
            <div style="border-bottom:1px solid \${borderColor};padding:20px 0;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div>
                  \${renderStars(r.rating)}
                  \${r.title ? \`<h4 style="margin:8px 0 4px;font-size:15px;">\${r.title}</h4>\` : ''}
                  <p style="margin:0;color:#6b7280;font-size:13px;">\${r.customer_name} · \${new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span style="background:\${accentColor}22;color:\${accentColor};padding:4px 10px;border-radius:20px;font-size:12px;">✓ Verified</span>
              </div>
              \${r.body ? \`<p style="margin:12px 0 0;line-height:1.6;">\${r.body}</p>\` : ''}
            </div>
          \`).join('')}
        </div>

        <!-- Powered by -->
        <div style="text-align:center;margin-top:20px;">
          <span style="font-size:11px;color:#9ca3af;">Powered by 🌸 ReviewBloom</span>
        </div>
      </div>
    \`;

    container.innerHTML = html;

    // Rating stars interaction
    let selectedRating = 0;
    const starInputs = container.querySelectorAll('.rb-star-input');
    starInputs.forEach(star => {
      star.addEventListener('mouseover', () => {
        const val = parseInt(star.dataset.value);
        starInputs.forEach((s, i) => {
          s.style.color = i < val ? '#f59e0b' : '#d1d5db';
        });
        const ratingText = container.querySelector('#rb-rating-text');
        if (ratingText) ratingText.textContent = t.stars[val];
      });
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        starInputs.forEach((s, i) => {
          s.style.color = i < selectedRating ? '#f59e0b' : '#d1d5db';
        });
      });
      star.addEventListener('mouseleave', () => {
        starInputs.forEach((s, i) => {
          s.style.color = i < selectedRating ? '#f59e0b' : '#d1d5db';
        });
      });
    });

    // Write review button
    container.querySelector('#rb-write-btn').addEventListener('click', () => {
      container.querySelector('#rb-form-container').style.display = 'block';
    });

    // Cancel button
    container.querySelector('#rb-cancel').addEventListener('click', () => {
      container.querySelector('#rb-form-container').style.display = 'none';
    });

    // Submit review
    container.querySelector('#rb-submit').addEventListener('click', async () => {
      const name = container.querySelector('#rb-name').value.trim();
      const email = container.querySelector('#rb-email').value.trim();
      const title = container.querySelector('#rb-title').value.trim();
      const body = container.querySelector('#rb-body').value.trim();

      if (!name || !selectedRating) {
        alert('Please enter your name and rating!');
        return;
      }

      const submitBtn = container.querySelector('#rb-submit');
      submitBtn.textContent = '...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(APP_URL + '/api/reviews/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop, product_id: productId,
            customer_name: name, customer_email: email,
            rating: selectedRating, title, body, language: lang
          })
        });
        const data = await res.json();
        if (data.success) {
          container.querySelector('#rb-form-inner').innerHTML = \`
            <div style="text-align:center;padding:40px;">
              <div style="font-size:48px;">🌸</div>
              <h3 style="color:\${accentColor};">\${t.thankYou}</h3>
            </div>
          \`;
        }
      } catch(e) {
        submitBtn.textContent = t.submit;
        submitBtn.disabled = false;
      }
    });
  }

  async function init() {
    const containers = document.querySelectorAll('[data-reviewbloom]');
    if (containers.length === 0) return;

    const settings = await getStoreSettings();
    const lang = settings.language || 'english';

    for (const container of containers) {
      const productId = container.dataset.productId;
      if (!productId) continue;
      const data = await getReviews(productId);
      renderWidget(container, data, settings, lang);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
  `;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(widgetJS);
});

export default router;
