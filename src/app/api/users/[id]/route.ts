import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// Update user details
const putHandler = async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const userId = parseInt(params.id, 10);
  const { name, username } = await req.json();
  const { id: currentUserId, role, organization_id } = req.user;

  // A user can update their own profile, or an admin can update any user in their org.
  if (currentUserId !== userId && role !== 'factory_admin') {
    return NextResponse.json({ msg: 'You are not authorized to perform this action.' }, { status: 403 });
  }

  try {
    // If username is being changed, check for availability
    if (username) {
      const [existingUser] = await sql`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${userId}
      `;
      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
      }
    }

    if (!name && !username) {
        return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const [updatedUser] = await sql`
      UPDATE users
      SET
        name = COALESCE(${name}, name),
        username = COALESCE(${username}, username)
      WHERE id = ${userId} AND organization_id = ${organization_id}
      RETURNING id, username, name, role, is_active
    `;

    if (!updatedUser) {
      return NextResponse.json({ msg: 'User not found or you do not have permission to update this user.' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

// Soft delete a user
const deleteHandler = async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const userId = parseInt(params.id, 10);
  const { organization_id } = req.user;

  try {
    const result = await sql`
      UPDATE users
      SET is_active = false
      WHERE id = ${userId} AND organization_id = ${organization_id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ msg: 'User not found or you do not have permission to deactivate this user.' }, { status: 404 });
    }

    return NextResponse.json({ msg: 'User deactivated successfully' });
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler, ['factory_admin']);