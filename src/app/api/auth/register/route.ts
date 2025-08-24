import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleError, BadRequestError, ConflictError } from '@/lib/errors';
import { createSession } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  organizationName: z.string().min(1, "Organization name is required."),
});

export const POST = handleError(async (request: Request) => {
  const body = await request.json();
  const validationResult = registerSchema.safeParse(body);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }

  const { name, username, password, organizationName } = validationResult.data;

  try {
    // Check if username already exists (case-insensitive)
    const { rows: existingUser } = await sql`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username})
    `;

    if (existingUser.length > 0) {
      throw new ConflictError('Username is already taken.');
    }

    // In a real app, you'd use a transaction here
    const { rows: orgResult } = await sql`
      INSERT INTO organizations (name) VALUES (${organizationName}) RETURNING id
    `;
    const organization_id = orgResult[0].id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { rows: userResult } = await sql`
      INSERT INTO users (organization_id, name, username, password_hash, role, is_active)
      VALUES (${organization_id}, ${name}, ${username}, ${password_hash}, 'super_admin', true)
      RETURNING id, name, username, role, is_active
    `;

    const user = userResult[0];

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      organization_id: organization_id,
    };

    const token = await createSession(payload);

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      organization_id: organization_id,
      is_active: user.is_active,
    };

    const response = NextResponse.json({ user: userResponse }, { status: 201 });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505') {
      throw new ConflictError('An organization with this name may already exist.');
    }
    // Re-throw other errors to be caught by the handleError wrapper
    throw err;
  }
});