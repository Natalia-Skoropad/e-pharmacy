'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@e-pharmacy/auth/core';
import { buildLoginRedirectPath } from '@e-pharmacy/auth/routing';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';
import { PageLoader } from '@/components/pharmacy/PageLoader';

//===================================================================

const PHARMACY_LOGIN_PATH = '/auth/login';
const CLIENT_APP_FALLBACK_PATH = '/';
const ADMIN_APP_FALLBACK_PATH = '/admin/dashboard';

//===================================================================

type PharmacyProtectedRouteProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function getForbiddenRedirectPath(role?: string) {
  if (role === 'admin') return ADMIN_APP_FALLBACK_PATH;
  return CLIENT_APP_FALLBACK_PATH;
}

//===================================================================

export function PharmacyProtectedRoute({
  children,
}: PharmacyProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const { status, isAuthenticated, isAuthReady, user, logout } = useAuth();
  const isPharmacy = user?.role === 'pharmacy';
  const isBlocked = user?.status === 'blocked';

  useEffect(() => {
    if (!isAuthReady || status === 'auth_unavailable') return;

    if (!isAuthenticated) {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;
      router.replace(buildLoginRedirectPath(currentPath, PHARMACY_LOGIN_PATH));
      return;
    }

    if (!isPharmacy) {
      router.replace(getForbiddenRedirectPath(user?.role));
      return;
    }

    if (isBlocked) {
      void logout().finally(() => {
        router.replace(
          `${PHARMACY_LOGIN_PATH}?reason=pharmacy-blocked&redirect=${encodeURIComponent(getPharmacyDashboardPath())}`
        );
      });
    }
  }, [
    isAuthReady,
    isAuthenticated,
    isBlocked,
    isPharmacy,
    logout,
    pathname,
    queryString,
    router,
    status,
    user?.role,
  ]);

  if (!isAuthReady || status === 'auth_unavailable') {
    return <PageLoader label="Checking pharmacy access..." />;
  }

  if (!isAuthenticated || !isPharmacy || isBlocked) {
    return <PageLoader label="Redirecting..." />;
  }

  return children;
}
