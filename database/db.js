import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initDB() {
  const client = await pool.connect();
  try {
    // Stores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        shop VARCHAR(255) UNIQUE NOT NULL,
        access_token VARCHAR(500) NOT NULL,
        email VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        language VARCHAR(20) DEFAULT 'english',
        auto_email BOOLEAN DEFAULT true,
        email_delay_days INTEGER DEFAULT 3,
        widget_theme VARCHAR(50) DEFAULT 'light',
        accent_color VARCHAR(20) DEFAULT '#10b981',
        installed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        shop VARCHAR(255) NOT NULL,
        product_id VARCHAR(100) NOT NULL,
        product_title VARCHAR(500),
        order_id VARCHAR(100),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(500),
        body TEXT,
        language VARCHAR(20) DEFAULT 'english',
        status VARCHAR(20) DEFAULT 'pending',
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Email queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        shop VARCHAR(255) NOT NULL,
        order_id VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        product_ids TEXT,
        product_titles TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database initialized successfully!');
  } catch (err) {
    console.error('❌ Database init error:', err);
  } finally {
    client.release();
  }
}

export default pool;
