-- Agent operations tracking table
CREATE TABLE IF NOT EXISTS agent_operations (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR NOT NULL,
  operation_type VARCHAR NOT NULL,
  target_store VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  items_processed INTEGER,
  items_updated INTEGER,
  items_new INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Product matching confidence tracking
CREATE TABLE IF NOT EXISTS product_matches (
  id SERIAL PRIMARY KEY,
  source_store VARCHAR NOT NULL,
  source_identifier VARCHAR NOT NULL,
  matched_product_id INTEGER REFERENCES products(id),
  confidence_score DECIMAL(5,4) NOT NULL,
  requires_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(source_store, source_identifier)
);

-- Create monitoring_metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR NOT NULL,
  value DECIMAL NOT NULL,
  tags JSONB,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create monitoring_alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  metricName VARCHAR NOT NULL,
  value DECIMAL NOT NULL,
  threshold DECIMAL NOT NULL,
  tags JSONB,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add platform field to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'platform'
  ) THEN
    ALTER TABLE products ADD COLUMN platform VARCHAR;
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url VARCHAR;
  END IF;
END $$;

-- Create detailed product attributes table
CREATE TABLE IF NOT EXISTS product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  weight DECIMAL(10,2),
  length DECIMAL(10,2),
  color VARCHAR,
  material VARCHAR,
  battery_type VARCHAR,
  magazine_capacity INTEGER,
  hop_up BOOLEAN,
  rail_system VARCHAR,
  firing_modes TEXT[],
  internals JSONB,
  externals JSONB,
  specs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create product variant table for handling different versions of same product
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  parent_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  variant_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR NOT NULL, -- color, version, bundle, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(parent_product_id, variant_product_id)
);

-- Create related products table for "frequently bought together" and similar products
CREATE TABLE IF NOT EXISTS related_products (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  related_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  relationship_type VARCHAR NOT NULL, -- accessory, compatible, similar, etc.
  strength DECIMAL(5,4) DEFAULT 0, -- How strongly related they are (for ranking)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(product_id, related_product_id, relationship_type)
);

-- Create standardized categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  parent_id INTEGER REFERENCES product_categories(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(name)
);

-- Create standardized brands table
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  logo_url VARCHAR,
  website VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(name)
);

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  store_name VARCHAR,
  rating DECIMAL(3,1) NOT NULL,
  review_text TEXT,
  review_source VARCHAR,
  reviewer_name VARCHAR,
  review_date TIMESTAMP WITH TIME ZONE,
  helpful_votes INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create a stored procedure to check and create agent-related tables
CREATE OR REPLACE FUNCTION check_and_create_agent_tables()
RETURNS void AS $$
BEGIN
  -- Check and create agent_operations table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_operations') THEN
    CREATE TABLE agent_operations (
      id SERIAL PRIMARY KEY,
      agent_name VARCHAR NOT NULL,
      operation_type VARCHAR NOT NULL,
      target_store VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      items_processed INTEGER,
      items_updated INTEGER,
      items_new INTEGER,
      start_time TIMESTAMP WITH TIME ZONE,
      end_time TIMESTAMP WITH TIME ZONE,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
  END IF;
  
  -- Check and create product_matches table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_matches') THEN
    CREATE TABLE product_matches (
      id SERIAL PRIMARY KEY,
      source_store VARCHAR NOT NULL,
      source_identifier VARCHAR NOT NULL,
      matched_product_id INTEGER REFERENCES products(id),
      confidence_score DECIMAL(5,4) NOT NULL,
      requires_review BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      UNIQUE(source_store, source_identifier)
    );
  END IF;
  
  -- Check and create monitoring_metrics table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'monitoring_metrics') THEN
    CREATE TABLE monitoring_metrics (
      id SERIAL PRIMARY KEY,
      metric_name VARCHAR NOT NULL,
      value DECIMAL NOT NULL,
      tags JSONB,
      timestamp TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
  END IF;
  
  -- Check and create monitoring_alerts table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'monitoring_alerts') THEN
    CREATE TABLE monitoring_alerts (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      metricName VARCHAR NOT NULL,
      value DECIMAL NOT NULL,
      threshold DECIMAL NOT NULL,
      tags JSONB,
      timestamp TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
  END IF;
  
  -- Add platform field to products table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'platform'
  ) THEN
    ALTER TABLE products ADD COLUMN platform VARCHAR;
  END IF;
  
  -- Add image_url field to products table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url VARCHAR;
  END IF;
  
  -- Check and create the new tables if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_attributes') THEN
    CREATE TABLE product_attributes (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      weight DECIMAL(10,2),
      length DECIMAL(10,2),
      color VARCHAR,
      material VARCHAR,
      battery_type VARCHAR,
      magazine_capacity INTEGER,
      hop_up BOOLEAN,
      rail_system VARCHAR,
      firing_modes TEXT[],
      internals JSONB,
      externals JSONB,
      specs JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    CREATE TABLE product_variants (
      id SERIAL PRIMARY KEY,
      parent_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      variant_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      variant_type VARCHAR NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      UNIQUE(parent_product_id, variant_product_id)
    );
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'related_products') THEN
    CREATE TABLE related_products (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      related_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      relationship_type VARCHAR NOT NULL,
      strength DECIMAL(5,4) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      UNIQUE(product_id, related_product_id, relationship_type)
    );
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    CREATE TABLE product_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      parent_id INTEGER REFERENCES product_categories(id),
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      UNIQUE(name)
    );
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'brands') THEN
    CREATE TABLE brands (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      logo_url VARCHAR,
      website VARCHAR,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      UNIQUE(name)
    );
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
    CREATE TABLE product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      store_name VARCHAR,
      rating DECIMAL(3,1) NOT NULL,
      review_text TEXT,
      review_source VARCHAR,
      reviewer_name VARCHAR,
      review_date TIMESTAMP WITH TIME ZONE,
      helpful_votes INTEGER DEFAULT 0,
      verified_purchase BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_operations_store_status ON agent_operations(target_store, status);
CREATE INDEX IF NOT EXISTS idx_agent_operations_start_time ON agent_operations(start_time);
CREATE INDEX IF NOT EXISTS idx_product_matches_confidence ON product_matches(confidence_score);
CREATE INDEX IF NOT EXISTS idx_product_matches_product_id ON product_matches(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_requires_review ON product_matches(requires_review) WHERE requires_review = TRUE;

-- Create indexes for monitoring tables
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name ON monitoring_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_timestamp ON monitoring_alerts(timestamp);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_parent_id ON product_variants(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_variant_id ON product_variants(variant_product_id);
CREATE INDEX IF NOT EXISTS idx_related_products_product_id ON related_products(product_id);
CREATE INDEX IF NOT EXISTS idx_related_products_related_id ON related_products(related_product_id);
CREATE INDEX IF NOT EXISTS idx_related_products_type ON related_products(relationship_type);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating); 