import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// Reactivate a user
const putHandler = async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const userId = parseInt(params.id, 10);
  const { organization_id } = req.user;

  try {
    const { rows: [reactivatedUser] } = await sql`
      UPDATE users
      SET is_active = true
      WHERE id = ${userId} AND organization_id = ${organization_id}
      RETURNING id, username, name, role, is_active
    `;

    if (!reactivatedUser) {
      return NextResponse.json({ msg: 'User not found or you do not have permission to reactivate this user.' }, { status: 404 });
    }

    return NextResponse.json({ msg: 'User reactivated successfully', user: reactivatedUser });
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = withAuth(putHandler, ['factory_admin']);