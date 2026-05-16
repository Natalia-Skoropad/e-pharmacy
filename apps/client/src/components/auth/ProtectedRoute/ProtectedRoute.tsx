'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { LoadingSpinner, StatusPage } from '@/components/common';
import { useAuth } from '@/components/providers';

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

  if (!isAuthReady) {
    return <LoadingSpinner label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return (
      <StatusPage
        title="Login required"
        text="You need to log in to access this page."
        primaryActionLabel="Go to login"
        primaryActionHref={buildLoginRedirectPath(pathname)}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
