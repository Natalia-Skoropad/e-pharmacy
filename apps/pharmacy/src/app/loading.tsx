'use client';

import { usePathname } from 'next/navigation';

import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { DashboardShellSkeleton } from '@/components/layout/PharmacyShell/DashboardShellSkeleton';

//===================================================================

function Loading() {
  const pathname = usePathname();

  if (
    pathname === '/pharmacy/dashboard' ||
    pathname.startsWith('/pharmacy/dashboard/')
  )
    return <DashboardShellSkeleton />;

  return <PageLoader label="Loading pharmacy cabinet..." />;
}

export default Loading;
