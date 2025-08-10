-- Migration to add product attributes table and update products table

-- 1. Create the product_attributes table
-- This table will store all the selectable options for product creation
CREATE TABLE IF NOT EXISTS product_attributes (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- e.g., 'category', 'series', 'color', 'model', 'quality', 'packaging_type'
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_attribute_per_org UNIQUE (organization_id, type, value)
);

-- Add comments for clarity
COMMENT ON COLUMN product_attributes.type IS 'The type of attribute (e.g., category, series, color).';
COMMENT ON COLUMN product_attributes.value IS 'The actual value of the attribute (e.g., ''Water Closet'', ''Designer'', ''Blue'').';


-- 2. Add new columns to the products table
-- These columns will store the selected category and series for each product.
-- We are adding them as VARCHAR to keep the queries simple, as requested.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category VARCHAR(255),
ADD COLUMN IF NOT EXISTS series VARCHAR(255);

-- Add comments for clarity
COMMENT ON COLUMN products.category IS 'The product category, derived from product_attributes.';
COMMENT ON COLUMN products.series IS 'The product series/collection, derived from product_attributes.';

-- Note: We are not adding foreign key constraints from products to product_attributes
-- to maintain simplicity in the application logic for now. The consistency will be
-- enforced by the UI using dropdowns populated from the product_attributes table.