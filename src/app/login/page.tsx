'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, useUser } from '@/firebase';
import { useAuthRedirect } from '@/firebase/auth/use-auth-redirect';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  useAuthRedirect();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center font-headline">
            Masuk ke InventoryFlow
          </CardTitle>
          <CardDescription className="text-center">
            Gunakan penyedia di bawah ini untuk masuk ke akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              Masuk dengan Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="#" className="underline">
              Daftar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
