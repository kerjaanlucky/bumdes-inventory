'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { useAuthStore } from '@/store/auth-store';

export function useAuthRedirect() {
  const { user, isUserLoading } = useUser();
  const { role, isLoading: isProfileLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    if (isLoading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

    if (user) {
      if (isAuthPage) {
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/user/dashboard');
        }
      }
    } else {
      if (!isAuthPage) {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, role, isProfileLoading, router, pathname]);
}

// Hook to protect a route and ensure user has a specific role
export function useRoleGuard(requiredRole: 'admin' | 'user') {
    const { user, isUserLoading } = useUser();
    const { role, isLoading: isProfileLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        const isLoading = isUserLoading || isProfileLoading;
        if (isLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (role && role !== requiredRole) {
            // If user has a role but it's not the required one, redirect
             if (role === 'admin') {
                router.replace('/admin');
             } else {
                router.replace('/user');
             }
        }
    }, [user, isUserLoading, role, isProfileLoading, requiredRole, router]);

    // Return a loading state to prevent rendering child components prematurely
    return isUserLoading || isProfileLoading || !user || role !== requiredRole;
}
