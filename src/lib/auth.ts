import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { sql } from '@vercel/postgres';
import { User } from '@/types';
import { cookies, headers } from 'next/headers';
import { UnauthorizedError } from './errors';
import fs from 'fs/promises';
import path from 'path';
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';

let privateKey: CryptoKey | KeyObject;
let publicKey: CryptoKey | KeyObject;

const formatPemKey = (key: string, type: 'PUBLIC' | 'PRIVATE'): string => {
          console.log(`--- Formatting ${type} Key ---`);
          console.log('Step 1: Initial raw key length:', key.length);

          const keyHeader = `-----BEGIN ${type} KEY-----`;
          const keyFooter = `-----END ${type} KEY-----`;

          // Step 2: Remove headers and footers
          let keyBody = key.replace(keyHeader, '').replace(keyFooter, '');
          console.log('Step 2: Key body after removing headers/footers length:', keyBody.length);

          // Step 3: Remove escaped newlines
          keyBody = keyBody.replace(/\\n/g, '');
          console.log('Step 3: Key body after removing escaped newlines length:', keyBody.length);
          
          // Step 4: Remove all other whitespace
          keyBody = keyBody.replace(/\s/g, '');
          console.log('Step 4: Final cleaned key body length:', keyBody.length);

          const keyBodyLines = keyBody.match(/.{1,64}/g)?.join('\n') || '';
          
          const finalKey = `${keyHeader}\n${keyBodyLines}\n${keyFooter}`;
          console.log('Step 5: Final reconstructed key:', finalKey);
          console.log(`--- End Formatting ${type} Key ---`);
          
          return finalKey;
        };

async function loadKeys() {
  if (privateKey && publicKey) {
    return;
  }
  try {
    const privateKeyEnv = process.env.JWT_PRIVATE_KEY
      ? formatPemKey(process.env.JWT_PRIVATE_KEY, 'PRIVATE')
      : null;
    const publicKeyEnv = process.env.JWT_PUBLIC_KEY
      ? formatPemKey(process.env.JWT_PUBLIC_KEY, 'PUBLIC')
      : null;

    const privateKeyData = privateKeyEnv || await fs.readFile(path.resolve(process.cwd(), 'private-key.pem'), 'utf-8');
    privateKey = createPrivateKey(privateKeyData);

    const publicKeyData = publicKeyEnv || await fs.readFile(path.resolve(process.cwd(), 'public-key.pem'), 'utf-8');
    publicKey = createPublicKey(publicKeyData);
  } catch (error) {
    console.error('Error loading cryptographic keys:', error);
    throw new Error('Could not load cryptographic keys. The application cannot start securely.');
  }
}

loadKeys();

export async function getSession(): Promise<User> {
  let token: string | undefined;
  const authHeader = headers().get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = cookies().get('token')?.value;
  }

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    await loadKeys();
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });
    const userPayload = payload as unknown as User;

    const { rows } = await sql`SELECT is_active FROM users WHERE id = ${userPayload.id}`;
    const user = rows[0];

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User is inactive');
    }

    return userPayload;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    console.error('JWT Verification Error:', err);
    throw new UnauthorizedError('Invalid token');
  }
}

export async function createSession(payload: Omit<User, 'is_active' | 'name' | 'language'>, rememberMe: boolean = false) {
  await loadKeys();
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setExpirationTime(rememberMe ? '30d' : '1d')
    .sign(privateKey);
}

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

type Handler = (
  req: AuthenticatedRequest,
  context: HandlerContext
) => Promise<NextResponse>;

export const withAuth = (handler: Handler, roles?: string[]) => {
  return async (req: NextRequest, context: HandlerContext) => {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await loadKeys();
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });

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
        if (!roles.includes(userPayload.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = userPayload;
      // By the time this handler is executed, authentication is confirmed.
      // We pass the request and the original context (which now has resolved params)
      // to the actual route handler.
      return handler(authenticatedReq, context);
    } catch (err) {
        if (err instanceof UnauthorizedError) throw err;
        console.error('JWT Verification Error:', err);
        throw new UnauthorizedError('Invalid token');
    }
  };
};