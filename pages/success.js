// /pages/success.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem('hasPaid', 'true');
    router.push('/');
  }, []);

  return <p>Redirecting...</p>;
}
