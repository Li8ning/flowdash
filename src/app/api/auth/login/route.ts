import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return NextResponse.json({ msg: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const { username, password } = await request.json();

    const userResult = await sql`SELECT * FROM users WHERE username = ${username}`;

    if (userResult.length === 0) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult[0];

    if (!user.is_active) {
      return NextResponse.json({ msg: 'Your account is currently inactive. Please contact an administrator.' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      organization_id: user.organization_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 });

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
      is_active: user.is_active,
    };

    return NextResponse.json({ token, user: userResponse });

  } catch (err: any) {
    console.error(err.message);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}