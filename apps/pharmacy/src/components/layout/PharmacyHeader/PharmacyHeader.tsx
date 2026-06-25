'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BurgerButton } from '@e-pharmacy/ui/layout';
import { Logo } from '@e-pharmacy/ui/common';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import { PharmacyBadge } from '@/components/layout/PharmacyBadge';
import { PharmacyLogoutButton } from '@/components/layout/PharmacyLogoutButton';
import { PharmacyMobileMenu } from '@/components/layout/PharmacyMobileMenu';

import css from './PharmacyHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'pharmacy-mobile-menu';

//===================================================================

export function PharmacyHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className={css.header}>
        <Logo
          href={getPharmacyDashboardPath()}
          label="E-PHARMACY"
          ariaLabel="E-PHARMACY pharmacy dashboard"
          renderLink={({ href, className, children, ...props }) => (
            <Link href={href} className={className} {...props}>
              {children}
            </Link>
          )}
        />

        <div className={css.actions}>
          <PharmacyBadge />
          <PharmacyLogoutButton className={css.logout} />
          <BurgerButton
            controlsId={MOBILE_MENU_ID}
            isOpen={isMenuOpen}
            openLabel="Open pharmacy menu"
            closeLabel="Close pharmacy menu"
            onClick={() => setIsMenuOpen((value) => !value)}
          />
        </div>
      </header>

      <PharmacyMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
