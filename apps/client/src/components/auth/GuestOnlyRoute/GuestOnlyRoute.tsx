'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { LoadingSpinner, StatusPage } from '@/components/common';
import { useAuth } from '@/providers';

import { getSafeRedirectPath } from '@/lib/routes';

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

  if (!isAuthReady) {
    return <LoadingSpinner label="Checking your session..." />;
  }

  if (isAuthenticated) {
    return (
      <StatusPage
        title="You are already logged in"
        text="We are redirecting you to your account."
        primaryActionLabel="Go to profile"
        primaryActionHref={redirectTo}
      />
    );
  }

  return children;
}

export default GuestOnlyRoute;
