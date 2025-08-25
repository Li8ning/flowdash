import { jwtVerify, importSPKI } from 'jose';
import { NextRequest } from 'next/server';

const formatPemKey = (key: string): string => {
  const keyHeader = `-----BEGIN PUBLIC KEY-----`;
  const keyFooter = `-----END PUBLIC KEY-----`;

  const keyBody = key
    .replace(keyHeader, '')
    .replace(keyFooter, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');

  const keyBodyLines = keyBody.match(/.{1,64}/g)?.join('\n') || '';
  
  const finalKey = `${keyHeader}\n${keyBodyLines}\n${keyFooter}`;
  
  return finalKey;
};

export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    console.error('Auth token missing from cookies');
    return { error: 'Missing authentication token', status: 401 };
  }

  try {
    const publicKeyEnv = process.env.JWT_PUBLIC_KEY;
    if (!publicKeyEnv) {
      throw new Error('JWT_PUBLIC_KEY environment variable is not set.');
    }
    const publicKey = await importSPKI(formatPemKey(publicKeyEnv), 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });
    return { user: payload, status: 200 };
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return { error: 'Invalid token', status: 401 };
  }
}