import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { initDB } from './database/db.js';
import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/reviews.js';
import webhookRoutes from './routes/webhooks.js';
import widgetRoutes from './routes/widget.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/widget', widgetRoutes);
app.use('/api/admin', adminRoutes);

// Main app page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Review submission page
app.get('/review', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'review.html'));
});

// Initialize DB and start server
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   🌸 ReviewBloom App                 ║
║   Running on port ${PORT}              ║
║   Multi-language Review Platform    ║
╚══════════════════════════════════════╝
    `);
  });
});
