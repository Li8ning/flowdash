import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);

  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user) {
    return NextResponse.json({ error: 'User not found in token' }, { status: 404 });
  }

  try {
    const { rows } = await sql`
      SELECT id, username, name, role, organization_id, is_active, language
      FROM users
      WHERE id = ${authResult.user.id as number}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (dbError) {
    console.error('Database error in /api/auth/me:', dbError);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}