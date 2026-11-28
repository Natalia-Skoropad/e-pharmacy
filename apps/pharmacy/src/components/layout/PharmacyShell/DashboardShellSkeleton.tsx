'use client';

import { useSyncExternalStore } from 'react';
import { LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

import { CabinetSidebar, CabinetTopBar } from '@e-pharmacy/ui/cabinet';
import { Container } from '@e-pharmacy/ui/layout';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';

import { DashboardPageSkeleton } from '@/components/dashboard/PharmacyDashboardPageContent/DashboardPageSkeleton';

import {
  getServerSidebarCollapsedSnapshot,
  getSidebarCollapsedSnapshot,
  subscribeToSidebarCollapsed,
  updateSidebarCollapsed,
} from './sidebar-collapsed-preference';

import sidebarCss from '../PharmacySidebar/PharmacySidebar.module.css';
import headerCss from '../PharmacyHeader/PharmacyHeader.module.css';
import css from './PharmacyShell.module.css';

//===================================================================

// Public, static navigation chrome only. Never mount private resources before auth.
export function DashboardShellSkeleton() {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getServerSidebarCollapsedSnapshot
  );

  return (
    <div className={css.shell} aria-busy="true">
      <Container className={css.container}>
        <div className={clsx(css.layout, collapsed && css.layoutCollapsed)}>
          <CabinetSidebar
            items={PHARMACY_NAVIGATION}
            activePath="/pharmacy/dashboard"
            ariaLabel="Pharmacy navigation"
            isCollapsed={collapsed}
            className={sidebarCss.sidebar}
            onToggleCollapsed={() => updateSidebarCollapsed(!collapsed)}
            renderLogoLink={({ className, children }) => (
              <span className={className}>{children}</span>
            )}
            renderLink={({ className, children }) => (
              <span className={className}>{children}</span>
            )}
          />
          <div className={css.workspace}>
            <header className={headerCss.header}>
              <CabinetTopBar
                items={[{ label: 'Dashboard' }]}
                leadingIcon={<LayoutDashboard size={18} aria-hidden="true" />}
                compactOnMobile
                className={headerCss.topbar}
                navigationToggle={
                  <span
                    className={css.loadingHeaderAction}
                    aria-hidden="true"
                  />
                }
                actions={
                  <div className={headerCss.actionsGroup} aria-hidden="true">
                    <span className={headerCss.fullscreenDesktop}>
                      <span className={css.loadingHeaderAction} />
                    </span>
                    <span className={headerCss.userDropdownDesktop}>
                      <span
                        className={clsx(
                          css.loadingHeaderAction,
                          css.loadingHeaderUser
                        )}
                      />
                    </span>
                  </div>
                }
              />
            </header>
            <div className={css.content}>
              <DashboardPageSkeleton />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
