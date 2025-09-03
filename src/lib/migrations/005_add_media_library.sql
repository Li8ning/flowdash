-- Migration to add media library tables for centralized image management

-- 1. Create the media_library table
-- This table will store all uploaded images for each organization
CREATE TABLE IF NOT EXISTS media_library (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  filepath TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for clarity
COMMENT ON COLUMN media_library.organization_id IS 'The organization that owns this media file.';
COMMENT ON COLUMN media_library.user_id IS 'The user who uploaded this media file.';
COMMENT ON COLUMN media_library.filename IS 'The original filename of the uploaded file.';
COMMENT ON COLUMN media_library.filepath IS 'The URL/path to the stored file in Vercel Blob.';
COMMENT ON COLUMN media_library.file_type IS 'The MIME type of the file (e.g., image/webp).';
COMMENT ON COLUMN media_library.file_size IS 'The size of the file in bytes.';

-- 2. Create the product_images table
-- This is a junction table linking products to their media files
CREATE TABLE IF NOT EXISTS product_images (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, media_id)
);

-- Add comments for clarity
COMMENT ON TABLE product_images IS 'Junction table linking products to their associated media files.';
COMMENT ON COLUMN product_images.product_id IS 'Reference to the product.';
COMMENT ON COLUMN product_images.media_id IS 'Reference to the media file.';

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_library_organization_id ON media_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_library_user_id ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_media_id ON product_images(media_id);

-- Note: The existing products.image_url column will be deprecated after migration
-- and can be removed in a future release once all data has been migrated.