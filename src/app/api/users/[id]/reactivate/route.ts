import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import { handleError, ForbiddenError, NotFoundError } from '@/lib/errors';

interface HandlerContext {
  params: { id: string };
}

// Reactivate a user
export const PUT = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const userId = parseInt(params.id, 10);
  const { organization_id } = authResult.user;

  const { rows: [reactivatedUser] } = await sql`
    UPDATE users
    SET is_active = true
    WHERE id = ${userId} AND organization_id = ${organization_id as number}
    RETURNING id, username, name, role, is_active
  `;

  if (!reactivatedUser) {
    throw new NotFoundError('User not found or you do not have permission to reactivate this user.');
  }

  return NextResponse.json({ message: 'User reactivated successfully', user: reactivatedUser });
});