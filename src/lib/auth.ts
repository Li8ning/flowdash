import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

interface UserPayload {
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

type Handler = (
  req: AuthenticatedRequest,
  context: any
) => Promise<NextResponse>;

export const withAuth = (handler: Handler, roles?: string[]) => {
  return async (req: NextRequest, context: any) => {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (roles && roles.length > 0) {
        const userRole = (payload as unknown as UserPayload).role;
        if (!roles.includes(userRole)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = payload as unknown as UserPayload;
      return handler(authenticatedReq, context);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
};