import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import logger from '../../../../../lib/logger';

const ALLOWED_ENTITIES: Record<string, string> = {
  products: 'products',
  inventory: 'inventory_logs',
};

const ALLOWED_FIELDS: Record<string, string> = {
  // products
  color: 'color',
  model: 'model',
  // inventory_logs
  quality: 'quality',
  packaging_type: 'packaging_type',
  // users (special case)
  users: 'users',
  // products (special case)
  product_name: 'products'
};

type Row = { [key: string]: string };

export const GET = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: { entity: string; field: string } }
) => {
  try {
    const { organization_id } = req.user;
    const { entity, field } = params;

    const tableName = ALLOWED_ENTITIES[entity];
    const columnName = ALLOWED_FIELDS[field];

    if (!tableName || !columnName) {
      return NextResponse.json({ error: 'Invalid entity or field' }, { status: 400 });
    }

    let rows: Row[];

    if (field === 'users') {
      const result = await sql`
        SELECT DISTINCT u.name
        FROM users u
        JOIN inventory_logs l ON u.id = l.user_id
        JOIN products p ON l.product_id = p.id
        WHERE p.organization_id = ${organization_id} AND u.name IS NOT NULL AND u.name != ''
        ORDER BY u.name
      `;
      rows = result.rows as Row[];
      return NextResponse.json(rows.map((row) => row.name));
    }
    
    if (field === 'product_name') {
        const result = await sql`
          SELECT DISTINCT p.name
          FROM products p
          JOIN inventory_logs l ON p.id = l.product_id
          WHERE p.organization_id = ${organization_id} AND p.name IS NOT NULL AND p.name != ''
          ORDER BY p.name
        `;
        rows = result.rows as Row[];
        return NextResponse.json(rows.map((row) => row.name));
    }

    // Standard query for other fields
    const result = await sql.query(
      `SELECT DISTINCT "${columnName}" FROM ${tableName} WHERE organization_id = $1 AND "${columnName}" IS NOT NULL AND "${columnName}" != '' ORDER BY "${columnName}"`,
      [organization_id]
    );
    rows = result.rows as Row[];

    return NextResponse.json(rows.map((row) => row[columnName]));

  } catch (err: unknown) {
    logger.error({ err, params }, `Failed to fetch distinct ${params.field} for ${params.entity}`);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
});