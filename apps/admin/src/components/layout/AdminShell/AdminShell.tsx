'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/layout';

import { getAdminBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';

import {
  getAdminNavigationForAccess,
  getAdminNavigationItemByPathname,
} from '@/lib/layout/navigation';

import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import { AdminHeader } from '@/components/layout/AdminHeader/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar/AdminSidebar';

import css from './AdminShell.module.css';

//===================================================================

type AdminShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { access } = useAdminAuthorization();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigation = useMemo(
    () => getAdminNavigationForAccess(access),
    [access]
  );

  const breadcrumbs = getAdminNavigationItemByPathname(pathname, navigation)
    ? getAdminBreadcrumbsByPathname(pathname)
    : [];

  return (
    <div className={css.shell}>
      <Container className={css.container}>
        <div
          className={clsx(
            css.layout,
            isSidebarCollapsed && css.layoutCollapsed
          )}
        >
          <AdminSidebar
            items={navigation}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() =>
              setIsSidebarCollapsed((isCollapsed) => !isCollapsed)
            }
          />

          <div className={css.workspace}>
            <AdminHeader breadcrumbs={breadcrumbs} navigation={navigation} />
            <div className={css.content}>{children}</div>
          </div>
        </div>
      </Container>
    </div>
  );
}
