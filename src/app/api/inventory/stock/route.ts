import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import { handleError } from '../../../../lib/errors';

export const dynamic = 'force-dynamic';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
  }
  
  const { organization_id, role } = authResult.user;
  if (!organization_id) {
    return NextResponse.json(
      { error: 'User is not associated with an organization' },
      { status: 400 }
    );
  }

  // Restrict access to super_admin and admin only
  if (role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json(
      { error: 'Access denied. Insufficient permissions.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const offset = (page - 1) * limit;
  const getTotal = searchParams.get('getTotal') === 'true';
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const design = searchParams.get('design');
  const color = searchParams.get('color');
  const quality = searchParams.get('quality');
  const packaging_type = searchParams.get('packaging_type');
  const showZeroStock = searchParams.get('showZeroStock') === 'true';

  // Build WHERE conditions
  const conditions = ['p.organization_id = $1', '(p.is_archived IS NULL OR p.is_archived = false)'];
  const params: (string | number)[] = [organization_id as number];
  let paramIndex = 2;

  if (search) {
    conditions.push(`p.name ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }
  if (category) {
    conditions.push(`p.category = $${paramIndex++}`);
    params.push(category);
  }
  if (design) {
    conditions.push(`p.design = $${paramIndex++}`);
    params.push(design);
  }
  if (color) {
    conditions.push(`p.color = $${paramIndex++}`);
    params.push(color);
  }
  if (quality) {
    conditions.push(`iss.quality = $${paramIndex++}`);
    params.push(quality);
  }
  if (packaging_type) {
    conditions.push(`iss.packaging_type = $${paramIndex++}`);
    params.push(packaging_type);
  }
  if (!showZeroStock) {
    conditions.push('iss.quantity > 0');
  }

  const whereClause = conditions.join(' AND ');

  // Main query to get stock data
  const stockQuery = `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.sku,
      p.category,
      p.design,
      p.color,
      p.image_url,
      iss.quality,
      iss.packaging_type,
      iss.quantity,
      iss.last_updated_at
    FROM products p
    LEFT JOIN inventory_summary iss ON p.id = iss.product_id
    WHERE ${whereClause}
    ORDER BY p.name ASC, iss.quality ASC, iss.packaging_type ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  // Count query for pagination
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total_products,
           COUNT(*) as total_stock_entries
    FROM products p
    LEFT JOIN inventory_summary iss ON p.id = iss.product_id
    WHERE ${whereClause}
  `;

  const stockPromise = sql.query(stockQuery, [...params, limit, offset]);

  let countPromise = null;
  if (getTotal) {
    countPromise = sql.query(countQuery, params);
  }

  const stockResult = await stockPromise;
  let countResult = null;
  if (getTotal) {
    countResult = await countPromise;
  }

  // Define types for better type safety
  interface StockEntry {
    quality: string;
    packaging_type: string;
    quantity: number;
    last_updated_at: string;
  }

  interface ProductStock {
    product_id: number;
    product_name: string;
    sku: string;
    category: string;
    design: string;
    color: string;
    image_url: string;
    stock_entries: StockEntry[];
    total_quantity: number;
  }

  // Define database row type
  interface DatabaseRow {
    product_id: number;
    product_name: string;
    sku: string;
    category: string;
    design: string;
    color: string;
    image_url: string;
    quality: string | null;
    packaging_type: string | null;
    quantity: number | null;
    last_updated_at: string | null;
  }

  // Transform the data to group by product
  const stockData = stockResult.rows as DatabaseRow[];
  const groupedData = stockData.reduce((acc: ProductStock[], row: DatabaseRow) => {
    const existingProduct = acc.find(p => p.product_id === row.product_id);
    
    if (existingProduct) {
      // Add stock entry to existing product
      if (row.quality && row.packaging_type) {
        existingProduct.stock_entries.push({
          quality: row.quality,
          packaging_type: row.packaging_type,
          quantity: row.quantity || 0,
          last_updated_at: row.last_updated_at || new Date().toISOString()
        });
      }
    } else {
      // Create new product entry
      const productEntry: ProductStock = {
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku,
        category: row.category,
        design: row.design,
        color: row.color,
        image_url: row.image_url,
        stock_entries: [],
        total_quantity: 0
      };

      // Add stock entry if it exists
      if (row.quality && row.packaging_type) {
        productEntry.stock_entries.push({
          quality: row.quality,
          packaging_type: row.packaging_type,
          quantity: row.quantity || 0,
          last_updated_at: row.last_updated_at || new Date().toISOString()
        });
      }

      acc.push(productEntry);
    }
    
    return acc;
  }, []);

  // Calculate total quantities for each product
  groupedData.forEach(product => {
    product.total_quantity = product.stock_entries.reduce(
      (sum: number, entry: StockEntry) => sum + (entry.quantity || 0),
      0
    );
  });

  let totalStockEntries = 0;

  if (getTotal && countResult) {
    totalStockEntries = parseInt(countResult.rows[0].total_stock_entries, 10);
  }

  const response: { data: ProductStock[]; totalCount?: number } = {
    data: groupedData,
  };

  if (getTotal) {
    response.totalCount = totalStockEntries; // Use totalStockEntries as totalCount for consistency
  }

  return NextResponse.json(response);
});