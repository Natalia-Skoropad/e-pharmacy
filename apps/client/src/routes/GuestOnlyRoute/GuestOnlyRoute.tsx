'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/providers';

import { getSafeRedirectPath } from '@e-pharmacy/config/routes';

//===================================================================

type GuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, isAuthReady } = useAuth();

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    router.replace(redirectTo);
  }, [isAuthReady, isAuthenticated, redirectTo, router]);

  if (!isAuthReady || isAuthenticated) {
    return null;
  }

  return children;
}

export default GuestOnlyRoute;
