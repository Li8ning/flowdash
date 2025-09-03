import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/auth-utils';
import sql from '../../../lib/db';
import { handleError, ForbiddenError } from '../../../lib/errors';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
  }

  // Check role-based access - only admin and super_admin can access media library
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('Access denied. Media library is only accessible to administrators.');
  }

  const { organization_id } = authResult.user;

  if (!organization_id) {
    return NextResponse.json({ data: [], totalCount: 0 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const offset = (page - 1) * limit;
  const getTotal = searchParams.get('getTotal') === 'true';
  const search = searchParams.get('search');

  const whereClauses = ['organization_id = $1'];
  const queryParams: (string | number)[] = [organization_id as number];
  let paramIndex = 2;

  if (search) {
    whereClauses.push(`filename ILIKE $${paramIndex++}`);
    queryParams.push(`%${search}%`);
  }

  const whereString = whereClauses.join(' AND ');

  const mediaPromise = sql.query(
    `SELECT
        id,
        filename,
        filepath,
        file_type,
        file_size,
        created_at,
        updated_at,
        user_id
      FROM media_library
      WHERE ${whereString}
      ORDER BY created_at DESC, id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, limit, offset]
  );

  const mediaResult = await mediaPromise;

  let totalCount = 0;
  if (getTotal) {
    const countResult = await sql.query(
      `SELECT COUNT(*) FROM media_library WHERE ${whereString}`,
      queryParams
    );
    totalCount = parseInt(countResult.rows[0].count, 10);
  }

  return NextResponse.json({
    data: mediaResult.rows,
    total: getTotal ? totalCount : undefined,
  });
});