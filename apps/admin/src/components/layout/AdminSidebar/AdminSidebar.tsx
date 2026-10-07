'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CabinetSidebar } from '@e-pharmacy/ui/cabinet';

import type { AdminNavigationItem } from '@/lib/layout/navigation';
import { ADMIN_ROUTES } from '@/lib/routes';
import { useAdminPharmacyOwnerNavigationBadge } from '@/providers/AdminPharmacyOwnerNavigationBadgeProvider';

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
  const { newOwnerCount } = useAdminPharmacyOwnerNavigationBadge();

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
      renderLink={({ item, href, className, children, ...props }) => {
        const isPharmacyOwnersLink = item.href === ADMIN_ROUTES.PHARMACY_OWNERS;
        const showNewOwnerBadge =
          isPharmacyOwnersLink && newOwnerCount !== null && newOwnerCount > 0;

        return (
          <Link
            href={href}
            className={
              isPharmacyOwnersLink
                ? `${className} ${css.pharmacyOwnersLink}`
                : className
            }
            {...props}
          >
            {children}

            {showNewOwnerBadge ? (
              isCollapsed ? (
                <span
                  className={css.collapsedBadge}
                  aria-label={`${newOwnerCount} new pharmacy owners`}
                />
              ) : (
                <span
                  className={css.badge}
                  aria-label={`${newOwnerCount} new pharmacy owners`}
                >
                  {newOwnerCount > 99 ? '99+' : newOwnerCount}
                </span>
              )
            ) : null}
          </Link>
        );
      }}
    />
  );
}
