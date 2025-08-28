-- Add category and design columns to the products table
ALTER TABLE products
ADD COLUMN category VARCHAR(255),
ADD COLUMN design VARCHAR(255);

-- Rename 'series' to 'design' in the product_attributes table
UPDATE product_attributes
SET type = 'design'
WHERE type = 'series';