import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  media_id: z.number().optional(),
  available_qualities: z.array(z.string()).optional(),
  available_packaging_types: z.array(z.string()).optional(),
  category: z.string().optional(),
  design: z.string().optional(),
});