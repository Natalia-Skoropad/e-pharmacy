'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BurgerButton } from '@e-pharmacy/ui/layout';
import { Container, Logo, LogoutButton, UserBadge } from '@e-pharmacy/ui/common';
import { useAuth } from '@e-pharmacy/auth/core';

import { getPharmacyDashboardPath, getPharmacyProfilePath } from '@/lib/pharmacy/routes';
import { getSharedLoginUrl } from '@/lib/pharmacy/shared-auth';

import { PharmacyMobileMenu } from '@/components/layout/PharmacyMobileMenu';

import css from './PharmacyHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'pharmacy-mobile-menu';

//===================================================================

export function PharmacyHeader() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      window.location.assign(getSharedLoginUrl());
    } finally {
      setIsLogoutLoading(false);
    }
  };

  return (
    <>
      <header className={css.header}>
        <Container className={css.container}>
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
            <UserBadge
              className={css.userBadge}
              href={getPharmacyProfilePath()}
              name={user?.name}
              pictureUrl={user?.pictureUrl}
              fallbackLabel="Profile"
            />

            <LogoutButton
              className={css.logoutButton}
              isLoading={isLogoutLoading}
              disabled={isLogoutLoading}
              onClick={handleLogout}
            />
          </div>

          <BurgerButton
            controlsId={MOBILE_MENU_ID}
            isOpen={isMenuOpen}
            openLabel="Open pharmacy menu"
            closeLabel="Close pharmacy menu"
            onClick={() => setIsMenuOpen((value) => !value)}
          />
        </Container>
      </header>

      <PharmacyMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
