'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/layout';

import { getAdminBreadcrumbsByPathname } from '@/lib/layout/breadcrumbs';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const breadcrumbs = getAdminBreadcrumbsByPathname(pathname);

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
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() =>
              setIsSidebarCollapsed((isCollapsed) => !isCollapsed)
            }
          />

          <div className={css.workspace}>
            <AdminHeader breadcrumbs={breadcrumbs} />
            <div className={css.content}>{children}</div>
          </div>
        </div>
      </Container>
    </div>
  );
}
