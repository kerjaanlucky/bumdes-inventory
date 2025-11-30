'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

const ADMIN_EMAILS = ['admin@example.com'];

export function useAuthRedirect() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      const isAdmin = ADMIN_EMAILS.includes(user.email || '');
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/user/dashboard');
      }
    }
  }, [user, isUserLoading, router]);
}
