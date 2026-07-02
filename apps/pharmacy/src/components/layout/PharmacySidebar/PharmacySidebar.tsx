'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CabinetSidebar } from '@e-pharmacy/ui/layout';

import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';
import { getPharmacyDashboardPath } from '@/lib/layout/routes';

import css from './PharmacySidebar.module.css';

//===================================================================

type PharmacySidebarProps = Readonly<{
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}>;

//===================================================================

export function PharmacySidebar({
  isCollapsed,
  onToggleCollapsed,
}: PharmacySidebarProps) {
  const pathname = usePathname();

  return (
    <CabinetSidebar
      className={css.sidebar}
      items={PHARMACY_NAVIGATION}
      activePath={pathname}
      ariaLabel="Pharmacy navigation"
      logoHref={getPharmacyDashboardPath()}
      logoLabel="E-PHARMACY"
      logoAriaLabel="E-PHARMACY pharmacy dashboard"
      isCollapsed={isCollapsed}
      collapseLabel="Collapse pharmacy menu"
      expandLabel="Expand pharmacy menu"
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
