import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, HandlerContext } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import logger from '@/lib/logger';

// Define a strict allowlist for entities and their queryable fields.
// This is the primary defense against SQL injection for identifiers.
const validationConfig = {
  products: {
    tableName: 'products',
    allowedFields: ['name', 'color', 'design', 'category'],
  },
  inventory: {
    tableName: 'inventory_logs',
    allowedFields: ['product_name', 'quality', 'packaging_type', 'users'],
  },
};

type ValidEntity = keyof typeof validationConfig;

async function getDistinctValues(
  req: AuthenticatedRequest,
  { params }: HandlerContext
) {
  const { entity, field } = params as { entity: string; field: string };
  const user = req.user;
  const { organization_id } = user;

  // 1. Validate the entity against our strict allowlist keys
  if (!(entity in validationConfig)) {
    logger.warn({ entity, field }, 'Invalid entity requested');
    return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
  }
  const validEntity = entity as ValidEntity;
  const config = validationConfig[validEntity];

  // 2. Validate the field against the allowed fields for that entity
  if (!config.allowedFields.includes(field)) {
    logger.warn({ entity, field }, 'Invalid field requested for entity');
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
  }

  try {
    let rows: { value: string }[];

    // Handle the special case for fetching user names from inventory logs
    if (validEntity === 'inventory' && field === 'users') {
        const result = await sql`
            SELECT DISTINCT u.username as value
            FROM users u
            INNER JOIN inventory_logs l ON u.id = l.user_id
            INNER JOIN products p ON l.product_id = p.id
            WHERE p.organization_id = ${organization_id}
              AND u.username IS NOT NULL AND u.username != ''
            ORDER BY u.username;
        `;
        rows = result.rows as { value: string }[];
    } else if (validEntity === 'inventory' && field === 'product_name') {
        const result = await sql`
            SELECT DISTINCT p.name as value
            FROM products p
            INNER JOIN inventory_logs l ON p.id = l.product_id
            WHERE p.organization_id = ${organization_id}
              AND p.name IS NOT NULL AND p.name != ''
            ORDER BY p.name;
        `;
        rows = result.rows as { value: string }[];
    } else if (validEntity === 'inventory') {
        const columnName = field;
        const result = await sql.query(
            `
                SELECT DISTINCT l."${columnName}" as value
                FROM inventory_logs l
                INNER JOIN products p ON l.product_id = p.id
                WHERE p.organization_id = $1
                  AND l."${columnName}" IS NOT NULL
                  AND CAST(l."${columnName}" AS TEXT) != ''
                ORDER BY value;
            `,
            [organization_id]
        );
        rows = result.rows as { value: string }[];
    }
    else {
        // Since @vercel/postgres does not support sql.identifier, we build the query string
        // manually. This is safe ONLY BECAUSE we have strictly validated both the
        // table name and column name against a hardcoded allowlist.
        const tableName = config.tableName;
        const columnName = field;

        const result = await sql.query(
            `
                SELECT DISTINCT "${columnName}" as value
                FROM "${tableName}"
                WHERE organization_id = $1
                  AND "${columnName}" IS NOT NULL
                  AND CAST("${columnName}" AS TEXT) != ''
                ORDER BY value;
            `,
            [organization_id]
        );
        rows = result.rows as { value: string }[];
    }

    // Return a simple array of strings
    return NextResponse.json(rows.map((row) => row.value));

  } catch (err: unknown) {
    logger.error({ err, entity, field }, `Failed to fetch distinct ${field} for ${entity}`);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
}

export const GET = withAuth(getDistinctValues);