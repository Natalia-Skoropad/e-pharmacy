'use client';

import { usePathname } from 'next/navigation';

import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { ClientProfileLoading } from '@/components/profile/ProfilePageContent/ClientProfileLoading';

//===================================================================

function LoadingPage() {
  const pathname = usePathname();

  if (pathname === '/profile') return <ClientProfileLoading />;

  return <PageLoader />;
}

export default LoadingPage;
