import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { handleError, ForbiddenError, BadRequestError } from '@/lib/errors';

const checkUsernameSchema = z.object({
  username: z.string().min(1, "Username is required"),
  excludeId: z.string().regex(/^\d+$/).optional(),
});

// Check if a username is available
export const GET = handleError(async (req: NextRequest) => {
  const session = await getSession();
  if (!['admin', 'super_admin'].includes(session.role)) {
    throw new ForbiddenError();
  }

  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  const validationResult = checkUsernameSchema.safeParse(params);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }

  const { username, excludeId } = validationResult.data;

  let query;
  if (excludeId) {
    query = sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${parseInt(excludeId, 10)}`;
  } else {
    query = sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})`;
  }

  const { rows } = await query;

  return NextResponse.json({ isAvailable: rows.length === 0 });
});