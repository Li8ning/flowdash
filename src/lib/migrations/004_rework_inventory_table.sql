-- Migration 004: Rework inventory table to support quality and packaging type tracking
-- This migration drops the old inventory table and creates a new inventory_summary table
-- that can track stock levels by product, quality, and packaging type

-- First, let's create the new inventory_summary table
CREATE TABLE public.inventory_summary (
    product_id INTEGER NOT NULL,
    quality VARCHAR(255) NOT NULL,
    packaging_type VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Composite primary key to ensure uniqueness per product/quality/packaging combination
    PRIMARY KEY (product_id, quality, packaging_type),
    
    -- Foreign key constraint to products table
    CONSTRAINT inventory_summary_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Ensure quantity is never negative
    CONSTRAINT quantity_must_be_non_negative CHECK (quantity >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_summary_product_id ON public.inventory_summary USING btree (product_id);
CREATE INDEX idx_inventory_summary_quality ON public.inventory_summary USING btree (quality);
CREATE INDEX idx_inventory_summary_packaging_type ON public.inventory_summary USING btree (packaging_type);
CREATE INDEX idx_inventory_summary_last_updated ON public.inventory_summary USING btree (last_updated_at);

-- Create trigger to automatically update last_updated_at
CREATE TRIGGER set_inventory_summary_updated_at 
    BEFORE UPDATE ON public.inventory_summary 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from inventory_logs to populate the new inventory_summary table
-- This aggregates all production logs by product, quality, and packaging type
INSERT INTO public.inventory_summary (product_id, quality, packaging_type, quantity, last_updated_at)
SELECT 
    il.product_id,
    COALESCE(il.quality, 'Standard') as quality,
    COALESCE(il.packaging_type, 'Open') as packaging_type,
    SUM(il.produced) as quantity,
    MAX(il.created_at) as last_updated_at
FROM public.inventory_logs il
WHERE il.product_id IS NOT NULL
GROUP BY il.product_id, COALESCE(il.quality, 'Standard'), COALESCE(il.packaging_type, 'Open')
HAVING SUM(il.produced) > 0;

-- Now drop the old inventory table (after data migration is complete)
DROP TABLE IF EXISTS public.inventory;

-- Add comment to document the table purpose
COMMENT ON TABLE public.inventory_summary IS 'Stores current stock levels for each product broken down by quality and packaging type. Updated in real-time from inventory_logs.';
COMMENT ON COLUMN public.inventory_summary.product_id IS 'Reference to the product in the products table';
COMMENT ON COLUMN public.inventory_summary.quality IS 'Quality grade of the product (e.g., A-Grade, B-Grade, Standard)';
COMMENT ON COLUMN public.inventory_summary.packaging_type IS 'Packaging type (e.g., Open, Boxed, Palletized)';
COMMENT ON COLUMN public.inventory_summary.quantity IS 'Current stock quantity for this product/quality/packaging combination';
COMMENT ON COLUMN public.inventory_summary.last_updated_at IS 'Timestamp of the last update to this stock record';