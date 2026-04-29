import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const translations = {
  english: {
    subject: 'How was your recent purchase?',
    greeting: 'Hi',
    message: 'We hope you are enjoying your purchase! We would love to hear your feedback.',
    cta: 'Write a Review',
    footer: 'Thank you for shopping with us!'
  },
  urdu: {
    subject: 'آپ کی خریداری کیسی رہی؟',
    greeting: 'سلام',
    message: 'امید ہے آپ اپنی خریداری سے خوش ہیں! ہم آپ کی رائے جاننا چاہتے ہیں۔',
    cta: 'ریویو لکھیں',
    footer: 'ہمارے ساتھ خریداری کا شکریہ!'
  },
  hindi: {
    subject: 'आपकी खरीदारी कैसी रही?',
    greeting: 'नमस्ते',
    message: 'हमें उम्मीद है कि आप अपनी खरीदारी से खुश हैं! हम आपकी राय जानना चाहते हैं।',
    cta: 'समीक्षा लिखें',
    footer: 'हमारे साथ खरीदारी करने के लिए धन्यवाद!'
  }
};

export async function sendReviewEmail(store, customerEmail, customerName, products, orderId) {
  const lang = store.language || 'english';
  const t = translations[lang] || translations.english;
  const accentColor = store.accent_color || '#10b981';

  const productLinks = products.map(p => {
    const reviewUrl = `${process.env.SHOPIFY_APP_URL}/review?shop=${store.shop}&product_id=${p.product_id}&product_title=${encodeURIComponent(p.title)}&order_id=${orderId}&email=${customerEmail}&name=${encodeURIComponent(customerName)}&lang=${lang}`;
    return `
      <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin:12px 0;display:flex;align-items:center;gap:16px;">
        <div style="flex:1;">
          <p style="margin:0;font-weight:600;color:#1a1a2e;">${p.title}</p>
          <a href="${reviewUrl}" style="display:inline-block;margin-top:8px;background:${accentColor};color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:14px;">${t.cta}</a>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,${accentColor},#059669);padding:40px;text-align:center;">
          <h1 style="margin:0;color:white;font-size:28px;">🌸 ReviewBloom</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">${t.subject}</p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px;">${t.greeting} ${customerName}! 👋</h2>
          <p style="color:#666;line-height:1.6;">${t.message}</p>

          <!-- Products -->
          <div style="margin:24px 0;">
            ${productLinks}
          </div>

          <!-- Stars decoration -->
          <div style="text-align:center;margin:24px 0;">
            <span style="font-size:32px;">⭐⭐⭐⭐⭐</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:13px;">${t.footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `ReviewBloom <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: t.subject,
      html,
    });
    console.log(`✅ Review email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Email send error:', error);
  }
}
