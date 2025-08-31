import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { handleError, UnauthorizedError, ForbiddenError, TooManyRequestsError } from '@/lib/errors';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/schemas/auth';
import { withValidation } from '@/lib/validations';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create rate limiter instance for login
const loginRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds by IP + username combination
});

export const POST = handleError(
  withValidation(loginSchema, async (req, body) => {
    const { username, password, rememberMe } = body;

    // Check rate limit after basic validation to allow proper error messages
    const ip = req.ip ?? req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const rateLimitKey = `${ip}:${username}`; // Use IP + username for user-specific tracking

    try {
      await loginRateLimiter.consume(rateLimitKey);
    } catch {
      // Get remaining attempts and reset time
      const limiterRes = await loginRateLimiter.get(rateLimitKey);
      const remaining = limiterRes?.remainingPoints ?? 0;
      const resetInSeconds = limiterRes ? Math.ceil(limiterRes.msBeforeNext / 1000) : 60;

      throw new TooManyRequestsError('Too many login attempts', {
        code: 'RATE_LIMIT_EXCEEDED',
        data: {
          remaining,
          resetIn: resetInSeconds
        }
      });
    }

    const { rows: userResult } = await sql`SELECT * FROM users WHERE username = ${username}`;

    // Get remaining attempts for error responses
    const limiterRes = await loginRateLimiter.get(rateLimitKey);
    const remainingAttempts = limiterRes?.remainingPoints ?? 10;

    if (userResult.length === 0) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', {
        code: 'INVALID_CREDENTIALS',
        data: {
          remaining: remainingAttempts
        }
      });
    }

    const user = userResult[0];

    if (!user.is_active) {
      throw new ForbiddenError('ACCOUNT_INACTIVE', {
        code: 'ACCOUNT_INACTIVE',
        data: {
          remaining: remainingAttempts
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', {
        code: 'INVALID_CREDENTIALS',
        data: {
          remaining: remainingAttempts
        }
      });
    }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    organization_id: user.organization_id,
    language: user.language,
  };

  const token = await createSession(payload, rememberMe);

  const userResponse = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    organization_id: user.organization_id,
    is_active: user.is_active,
    language: user.language,
  };

  const response = NextResponse.json({ user: userResponse });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days or 1 day
    path: '/',
    sameSite: 'strict',
  });

  response.cookies.set('i18next', user.language, {
    path: '/',
  });

    return response;
  })
);