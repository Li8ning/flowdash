'use client';
import Register from '@/components/Register';
import { Suspense } from 'react';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Register />
    </Suspense>
  );
}