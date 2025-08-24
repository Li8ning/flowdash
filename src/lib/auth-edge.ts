import { jwtVerify } from 'jose';
import { createPublicKey, KeyObject } from 'crypto';

let publicKey: CryptoKey | KeyObject;

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

async function loadPublicKey() {
  if (publicKey) {
    return publicKey;
  }
  
  const publicKeyEnv = process.env.JWT_PUBLIC_KEY
    ? formatPemKey(process.env.JWT_PUBLIC_KEY)
    : null;

  if (!publicKeyEnv) {
    throw new Error('JWT_PUBLIC_KEY environment variable is not set.');
  }

  publicKey = createPublicKey(publicKeyEnv);
  return publicKey;
}

export async function verifyJwt(token: string) {
  const publicKey = await loadPublicKey();
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ['RS256'],
  });
  return payload;
}