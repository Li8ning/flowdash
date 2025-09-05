export type Role = 'super_admin' | 'admin' | 'floor_staff';

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  is_active: boolean;
  organization_id: number;
  language?: string;
}
export interface Product {
  id: number;
  name: string;
  sku: string;
  color: string;
  category: string;
  design: string;
  image_url?: string; // Keep for backward compatibility during migration
  media_id?: number;
  available_qualities: string[];
  available_packaging_types: string[];
}

export interface ProductAttribute {
  id: number;
  type: string;
  value: string;
}
export interface GroupedAttributes {
  [key: string]: ProductAttribute[];
}

export interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  color: string;
  design: string;
  produced: number;
  created_at: string;
  username?: string;
  image_url?: string; // Keep for backward compatibility during migration
  quality: string;
  packaging_type: string;
}