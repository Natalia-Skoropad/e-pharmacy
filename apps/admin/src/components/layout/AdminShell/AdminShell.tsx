'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/layout';

import { subscribeToAdminBreadcrumbLabels } from '@/lib/layout/breadcrumb-label-event';
import { getAdminBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';

import {
  getAdminNavigationForAccess,
  getAdminNavigationItemByPathname,
} from '@/lib/layout/navigation';

import { ADMIN_ROUTES } from '@/lib/routes';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import { AdminHeader } from '@/components/layout/AdminHeader/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar/AdminSidebar';

import css from './AdminShell.module.css';

//===================================================================

type BreadcrumbOverride = Readonly<{
  pathname: string;
  label: string;
}>;

//===================================================================

type AdminShellProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { access } = useAdminAuthorization();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [breadcrumbOverride, setBreadcrumbOverride] =
    useState<BreadcrumbOverride | null>(null);

  const navigation = useMemo(
    () => getAdminNavigationForAccess(access),
    [access]
  );

  const hasBreadcrumbs =
    pathname === ADMIN_ROUTES.PROFILE ||
    Boolean(getAdminNavigationItemByPathname(pathname, navigation));

  const currentDetailLabel =
    breadcrumbOverride?.pathname === pathname
      ? breadcrumbOverride.label
      : undefined;

  const breadcrumbs = hasBreadcrumbs
    ? getAdminBreadcrumbsByPathname(pathname, currentDetailLabel)
    : [];

  useEffect(() => {
    return subscribeToAdminBreadcrumbLabels((detail) => {
      setBreadcrumbOverride({
        pathname: detail.pathname,
        label: detail.label,
      });
    });
  }, []);

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
