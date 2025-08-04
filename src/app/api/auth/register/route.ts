import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return NextResponse.json({ msg: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const { name, username, password, organizationName } = await request.json();

    if (!name || !username || !password || !organizationName) {
      return NextResponse.json({ msg: 'Please enter all fields' }, { status: 400 });
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ msg: 'Username is already taken.' }, { status: 400 });
    }

    // In a real app, you'd use a transaction here
    const orgResult = await pool.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [organizationName]
    );
    const organization_id = orgResult.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await pool.query(
      'INSERT INTO users (organization_id, name, username, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role, is_active',
      [organization_id, name, username, password_hash, 'factory_admin', true]
    );

    const user = userResult.rows[0];

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        organization_id: organization_id,
      },
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        organization_id: organization_id,
        is_active: user.is_active,
      },
    }, { status: 201 });

  } catch (err: any) {
    console.error(err.message);
    if (err.code === '23505') { // Unique constraint violation
      return NextResponse.json({ msg: 'User or organization already exists' }, { status: 400 });
    }
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}