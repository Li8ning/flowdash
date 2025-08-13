import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { createPublicKey } from 'crypto';

export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    console.error('Auth token missing from cookies');
    return { error: 'Missing authentication token', status: 401 };
  }

  try {
    // The public key must be imported as a CryptoKey object for 'jose' to use it.
    const publicKey = createPublicKey(process.env.JWT_PUBLIC_KEY as string);
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });
    return { user: payload, status: 200 };
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return { error: 'Invalid token', status: 401 };
  }
}