'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/providers';

import { buildLoginRedirectPath } from '@/lib/routes';

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

  if (!isAuthReady || !isAuthenticated) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
