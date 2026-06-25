'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { Logo } from '@e-pharmacy/ui/common';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/layout';

import { PHARMACY_NAVIGATION } from '@/lib/pharmacy/navigation';
import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import { PharmacyBadge } from '@/components/layout/PharmacyBadge';
import { PharmacyLogoutButton } from '@/components/layout/PharmacyLogoutButton';
import { PharmacyNavLink } from '@/components/layout/PharmacyNavLink';

import css from './PharmacyMobileMenu.module.css';

//===================================================================

type PharmacyMobileMenuProps = Readonly<{
  id: string;
  isOpen: boolean;
  onClose: () => void;
}>;

//===================================================================

export function PharmacyMobileMenu({
  id,
  isOpen,
  onClose,
}: PharmacyMobileMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) onClose();
    // Close only on route change. onClose is intentionally omitted because it is recreated by the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <MobileOffcanvasBase
      id={id}
      isOpen={isOpen}
      title="Pharmacy menu"
      onClose={onClose}
      classNames={{
        backdrop: css.backdrop,
        backdropOpen: css.backdropOpen,
        panel: css.panel,
      }}
    >
      <div className={css.header}>
        <Logo
          href={getPharmacyDashboardPath()}
          label="E-PHARMACY"
          ariaLabel="E-PHARMACY pharmacy dashboard"
          renderLink={({ href, className, children, ...props }) => (
            <Link
              href={href}
              className={className}
              {...props}
              onClick={onClose}
            >
              {children}
            </Link>
          )}
        />
        <PharmacyBadge />
      </div>

      <nav className={css.nav} aria-label="Main pharmacy pages">
        {PHARMACY_NAVIGATION.map((item) => (
          <PharmacyNavLink key={item.href} item={item} onNavigate={onClose} />
        ))}
      </nav>

      <div className={css.footer}>
        <PharmacyLogoutButton />
      </div>
    </MobileOffcanvasBase>
  );
}
