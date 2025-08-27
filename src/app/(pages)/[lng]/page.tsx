'use client';
import Login from '@/components/Login';
import { Suspense } from 'react';

export default function LoginPage({ params: { lng } }: { params: { lng: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login lng={lng} />
    </Suspense>
  );
}
