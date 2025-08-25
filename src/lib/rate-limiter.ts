import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { TooManyRequestsError } from './errors';

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds by IP
});

export const withRateLimiter = <P>(
  handler: (req: NextRequest, context: { params: P }) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: { params: P }) => {
    const ip = req.ip ?? req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    try {
      await rateLimiter.consume(ip);
      return await handler(req, context);
    } catch {
      throw new TooManyRequestsError('Too many requests');
    }
  };
};