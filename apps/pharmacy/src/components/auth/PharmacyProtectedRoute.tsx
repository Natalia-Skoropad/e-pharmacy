'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@e-pharmacy/auth/core';
import { getPharmacyDashboardPath } from '@e-pharmacy/config/pharmacy';

import {
  getSharedLoginUrl,
  getSharedLoginUrlForCurrentPharmacyPage,
} from '@/lib/auth/shared-auth';

import { PageLoader } from '@e-pharmacy/ui/status-pages';

//===================================================================

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
      window.location.assign(
        getSharedLoginUrlForCurrentPharmacyPage(currentPath)
      );
      return;
    }

    if (!isPharmacy) {
      router.replace(getForbiddenRedirectPath(user?.role));
      return;
    }

    if (isBlocked) {
      void logout().finally(() => {
        window.location.assign(getSharedLoginUrl(getPharmacyDashboardPath()));
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
