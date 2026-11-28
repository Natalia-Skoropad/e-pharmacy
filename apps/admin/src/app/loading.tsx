'use client';

import { usePathname } from 'next/navigation';

import { ProfilePageSkeleton } from '@e-pharmacy/ui/profile';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

//===================================================================

function Loading() {
  const pathname = usePathname();

  if (pathname === '/admin/profile')
    return <ProfilePageSkeleton label="Loading admin profile" />;

  return <PageLoader label="Loading admin cabinet..." />;
}

export default Loading;
