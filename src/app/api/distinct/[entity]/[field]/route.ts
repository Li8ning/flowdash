import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import sql from '../../../../../lib/db';
import logger from '../../../../../lib/logger';
import { UserPayload } from '../../../../../lib/auth';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const ALLOWED_ENTITIES: Record<string, string> = {
  products: 'products',
  inventory: 'inventory_logs',
};

const ALLOWED_FIELDS: Record<string, string> = {
  // products
  color: 'color',
  design: 'design',
  category: 'category',
  // inventory_logs
  quality: 'quality',
  packaging_type: 'packaging_type',
  // users (special case)
  users: 'users',
  // products (special case)
  product_name: 'products'
};

type Row = { [key: string]: string };

export async function GET(
  req: NextRequest,
  { params }: { params: { entity: string; field: string } }
) {
  const { entity, field } = params;

  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = payload as unknown as UserPayload;

    const dbUserResult = await sql`SELECT is_active FROM users WHERE id = ${user.id}`;
    const dbUser = dbUserResult.rows[0];

    if (!dbUser || dbUser.is_active === false) {
      const response = NextResponse.json({ error: 'Unauthorized: User is inactive' }, { status: 401 });
      response.cookies.delete('token');
      return response;
    }

    const { organization_id } = user;
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
    let query;
    const queryParams = [organization_id];

    if (tableName === 'inventory_logs') {
      query = `
        SELECT DISTINCT t."${columnName}"
        FROM inventory_logs t
        JOIN products p ON t.product_id = p.id
        WHERE p.organization_id = $1
          AND t."${columnName}" IS NOT NULL
          AND CAST(t."${columnName}" AS TEXT) != ''
        ORDER BY t."${columnName}"
      `;
    } else {
      query = `
        SELECT DISTINCT "${columnName}"
        FROM ${tableName}
        WHERE organization_id = $1
          AND "${columnName}" IS NOT NULL
          AND CAST("${columnName}" AS TEXT) != ''
        ORDER BY "${columnName}"
      `;
    }

    const result = await sql.query(query, queryParams);
    rows = result.rows as Row[];

    return NextResponse.json(rows.map((row) => row[columnName]));

  } catch (err: unknown) {
    if ((err as Error).name === 'JWTExpired' || (err as Error).name === 'JWSInvalid') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error({ err, entity, field }, `Failed to fetch distinct ${field} for ${entity}`);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
}