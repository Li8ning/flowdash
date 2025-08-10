import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@vercel/postgres';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface UserPayload {
  id: number;
  username: string;
  role: string;
  organization_id: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user: UserPayload;
}

export interface HandlerContext {
  params: { [key: string]: string | string[] | undefined };
}

type Handler<T extends HandlerContext> = (
  req: AuthenticatedRequest,
  context: T
) => Promise<NextResponse>;

export const withAuth = <T extends HandlerContext>(handler: Handler<T>, roles?: string[]) => {
  return async (req: NextRequest, context: T) => {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const userPayload = payload as unknown as UserPayload;

      // Check if user is active in the database
      const { rows } = await sql`SELECT is_active FROM users WHERE id = ${userPayload.id}`;
      const user = rows[0];

      if (!user || user.is_active === false) {
        // Clear the cookie on the server-side response
        const response = NextResponse.json({ error: 'Unauthorized: User is inactive' }, { status: 401 });
        response.cookies.delete('token');
        return response;
      }

      if (roles && roles.length > 0) {
        // Case-insensitive role check
        if (!userPayload.role || !roles.includes(userPayload.role.toUpperCase())) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = userPayload;
      // By the time this handler is executed, authentication is confirmed.
      // We pass the request and the original context (which now has resolved params)
      // to the actual route handler.
      return handler(authenticatedReq, context);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
};