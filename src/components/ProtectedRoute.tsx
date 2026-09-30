'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getUserProfile, removeAuthToken } from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    // Verify token with backend
    getUserProfile()
      .then((res) => {
        if (res) {
          setIsAuthorized(true);
        } else {
          removeAuthToken();
          router.replace('/login');
        }
      })
      .catch((err) => {
        console.warn('Session expired or invalid, redirecting to login:', err);
        removeAuthToken();
        router.replace('/login');
      });
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Memeriksa sesi login...</div>
      </div>
    );
  }

  return <>{children}</>;
}
