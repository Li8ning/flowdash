import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log(`[API/ME] Received request for /api/auth/me`);
  console.log(`[API/ME] Request headers:`, Object.fromEntries(request.headers.entries()));

  const authResult = await verifyAuth(request);

  console.log(`[API/ME] Auth result:`, authResult);

  if (authResult.error) {
    console.log(`[API/ME] Authentication failed: ${authResult.error}`);
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