'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CabinetSidebar } from '@e-pharmacy/ui/cabinet';

import type { AdminNavigationItem } from '@/lib/layout/navigation';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './AdminSidebar.module.css';

//===================================================================

type AdminSidebarProps = Readonly<{
  items: readonly AdminNavigationItem[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}>;

//===================================================================

export function AdminSidebar({
  items,
  isCollapsed,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <CabinetSidebar
      className={css.sidebar}
      items={items}
      activePath={pathname}
      ariaLabel="Admin navigation"
      logoHref={ADMIN_ROUTES.DASHBOARD}
      logoLabel="E-PHARMACY"
      logoAriaLabel="E-PHARMACY admin dashboard"
      isCollapsed={isCollapsed}
      collapseLabel="Collapse admin menu"
      expandLabel="Expand admin menu"
      onToggleCollapsed={onToggleCollapsed}
      renderLogoLink={({ href, className, children, ...props }) => (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )}
      renderLink={({ href, className, children, ...props }) => (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )}
    />
  );
}
