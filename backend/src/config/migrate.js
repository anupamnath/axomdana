const db = require('./database');

const migrate = async () => {
  console.log('Running migrations...');

  const sql = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      mrp DECIMAL(10, 2),
      wholesale_price DECIMAL(10, 2),
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      image_url VARCHAR(500),
      category VARCHAR(100),
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Cart items table
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      total DECIMAL(10, 2) NOT NULL,
      shipping_address TEXT NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      payment_method VARCHAR(50) DEFAULT 'upi',
      payment_status VARCHAR(50) DEFAULT 'pending',
      upi_transaction_id VARCHAR(255),
      invoice_number VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Order items table
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL
    );

    -- Settings table (for UPI ID, SMTP config, etc.)
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Hero slides table (for admin-managed landing page slides)
    CREATE TABLE IF NOT EXISTS hero_slides (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      image_url VARCHAR(500) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Product reviews (verified-buyer reviews with star ratings, moderated by admin)
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(120),
      body TEXT NOT NULL,
      delivery_rating SMALLINT CHECK (delivery_rating IS NULL OR (delivery_rating >= 1 AND delivery_rating <= 5)),
      quality_rating SMALLINT CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      is_rejected BOOLEAN NOT NULL DEFAULT FALSE,
      rejection_reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(product_id, user_id)
    );

    -- Review images: photos attached to a review (delivery photos etc.)
    CREATE TABLE IF NOT EXISTS review_images (
      id SERIAL PRIMARY KEY,
      review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
      image_url VARCHAR(500) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Delivery images: customer-shared photos of delivered orders (gallery on home + product page)
    CREATE TABLE IF NOT EXISTS delivery_images (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      image_url VARCHAR(500) NOT NULL,
      caption VARCHAR(255),
      customer_name VARCHAR(120),
      location VARCHAR(120),
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_approved BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON product_reviews(product_id, is_approved);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_images_product ON delivery_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_images_approved ON delivery_images(is_approved, created_at DESC);
  `;

  // Add missing columns to orders table (for existing databases)
  const alterSql = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
      ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'phone'
      ) THEN
        ALTER TABLE orders ADD COLUMN phone VARCHAR(20);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'email'
      ) THEN
        ALTER TABLE orders ADD COLUMN email VARCHAR(255);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_method'
      ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'upi';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_status'
      ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'upi_transaction_id'
      ) THEN
        ALTER TABLE orders ADD COLUMN upi_transaction_id VARCHAR(255);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'invoice_number'
      ) THEN
        ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(50);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'remarks'
      ) THEN
        ALTER TABLE orders ADD COLUMN remarks TEXT;
      END IF;

      -- Products: MRP (Maximum Retail Price) — original price shown with strikethrough
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'mrp'
      ) THEN
        ALTER TABLE products ADD COLUMN mrp DECIMAL(10, 2);
      END IF;

      -- Products: Wholesale Price - actual selling price (defaults to price for existing rows)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'wholesale_price'
      ) THEN
        ALTER TABLE products ADD COLUMN wholesale_price DECIMAL(10, 2);
      END IF;

      -- Products: Featured flag - featured products show first in the products list
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'is_featured'
      ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;
    END $$;

    -- Create new tables (product_reviews, review_images, delivery_images) for existing databases
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(120),
      body TEXT NOT NULL,
      delivery_rating SMALLINT CHECK (delivery_rating IS NULL OR (delivery_rating >= 1 AND delivery_rating <= 5)),
      quality_rating SMALLINT CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      is_rejected BOOLEAN NOT NULL DEFAULT FALSE,
      rejection_reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(product_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS review_images (
      id SERIAL PRIMARY KEY,
      review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
      image_url VARCHAR(500) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_images (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      image_url VARCHAR(500) NOT NULL,
      caption VARCHAR(255),
      customer_name VARCHAR(120),
      location VARCHAR(120),
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_approved BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON product_reviews(product_id, is_approved);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_images_product ON delivery_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_images_approved ON delivery_images(is_approved, created_at DESC);

    -- Backfill: for existing products, set wholesale_price = price and mrp = price if missing
    UPDATE products SET wholesale_price = price WHERE wholesale_price IS NULL;
    UPDATE products SET mrp = price WHERE mrp IS NULL;

    -- Index for fast featured-first ordering
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
  `;

  try {
    await db.query(sql);
    await db.query(alterSql);
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }

  process.exit(0);
};

migrate();
