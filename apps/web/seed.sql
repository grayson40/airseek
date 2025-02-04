-- Products table (core product info)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  brand VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  platform VARCHAR NULL,
  type VARCHAR NOT NULL,
  fps_min INTEGER,
  fps_max INTEGER,
  images TEXT[],
  lowest_price DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Store prices table (current prices at each store)
CREATE TABLE store_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  store_name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  free_shipping_threshold DECIMAL(10,2),
  in_stock BOOLEAN NOT NULL,
  url VARCHAR NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Price history table (track price changes)
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  store_name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_store_prices_product_id ON store_prices(product_id);
CREATE INDEX idx_store_prices_store_name ON store_prices(store_name);
CREATE INDEX idx_store_prices_price ON store_prices(price);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);

-- Update trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update product price ranges
CREATE OR REPLACE FUNCTION update_product_price_ranges()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        lowest_price = subquery.min_price,
        highest_price = subquery.max_price
    FROM (
        SELECT 
            product_id,
            MIN(price) as min_price,
            MAX(price) as max_price
        FROM store_prices
        WHERE product_id = NEW.product_id
        GROUP BY product_id
    ) as subquery
    WHERE products.id = subquery.product_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_price_ranges
    AFTER INSERT OR UPDATE ON store_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_product_price_ranges();