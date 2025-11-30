'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function useAuthRedirect() {
  const { user, role, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

    if (user) {
      // User is logged in
      if (isAuthPage) {
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'user') {
          router.replace('/user/dashboard');
        } 
        // If role is not yet determined, we wait. isLoading should handle this.
      }
    } else {
      // User is not logged in
      if (!isAuthPage) {
        router.replace('/login');
      }
    }
  }, [user, role, isLoading, router, pathname]);
}

// Hook to protect a route and ensure user has a specific role
export function useRoleGuard(requiredRole: 'admin' | 'user') {
    const { user, role, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (role && role !== requiredRole) {
            if (role === 'admin') {
                router.replace('/admin');
            } else {
                router.replace('/user');
            }
        }
    }, [user, role, isLoading, requiredRole, router]);

    // Return the loading state to prevent rendering child components prematurely
    return isLoading || !user || !role || role !== requiredRole;
}
