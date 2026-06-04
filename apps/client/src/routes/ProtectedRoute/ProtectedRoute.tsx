'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { LoadingSpinner } from '@e-pharmacy/ui/common';
import { useAuth } from '@/providers';

import { buildLoginRedirectPath } from '@e-pharmacy/config/routes';

//===================================================================

type ProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || isAuthenticated) return;

    const queryString = searchParams.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(buildLoginRedirectPath(currentPath));
  }, [isAuthReady, isAuthenticated, pathname, router, searchParams]);

  if (!isAuthReady) {
    return <LoadingSpinner label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner label="Redirecting to login..." />;
  }

  return children;
}

export default ProtectedRoute;
