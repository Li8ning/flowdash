-- Add content_hash column for duplicate image detection
ALTER TABLE media_library ADD COLUMN content_hash VARCHAR(64);

-- Create index for performance
CREATE INDEX idx_media_library_content_hash_org ON media_library(content_hash, organization_id);

-- Optional: Add comment for documentation
COMMENT ON COLUMN media_library.content_hash IS 'SHA-256 hash of image content for duplicate detection';