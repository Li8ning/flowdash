import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

// Check if a username is available
const getHandler = async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const excludeId = searchParams.get('excludeId');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    let query;
    if (excludeId) {
      query = sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${parseInt(excludeId, 10)}`;
    } else {
      query = sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})`;
    }

    const { rows } = await query;

    return NextResponse.json({ isAvailable: rows.length === 0 });
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler, ['factory_admin']);