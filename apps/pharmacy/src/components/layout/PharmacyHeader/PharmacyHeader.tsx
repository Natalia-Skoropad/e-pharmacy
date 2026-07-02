'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Store, UserRound } from 'lucide-react';

import type { BreadcrumbItem } from '@e-pharmacy/ui/layout';
import { BurgerButton, CabinetTopBar } from '@e-pharmacy/ui/layout';
import {
  Container,
  Logo,
  LogoutButton,
  UserBadge,
} from '@e-pharmacy/ui/common';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  getPharmacyDashboardPath,
  getPharmacyProfilePath,
} from '@/lib/layout/routes';
import { getSharedLoginUrl } from '@/lib/auth/shared-auth';

import { PharmacyMobileMenu } from '@/components/layout/PharmacyMobileMenu';

import css from './PharmacyHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'pharmacy-mobile-menu';

const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL?.trim() || 'http://localhost:3000';

//===================================================================

type PharmacyHeaderProps = Readonly<{
  breadcrumbs: readonly BreadcrumbItem[];
}>;

//===================================================================

export function PharmacyHeader({ breadcrumbs }: PharmacyHeaderProps) {
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);

    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isUserMenuOpen]);

  return (
    <>
      <header className={css.header}>
        <Container className={css.mobileContainer}>
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

          <BurgerButton
            controlsId={MOBILE_MENU_ID}
            isOpen={isMenuOpen}
            openLabel="Open pharmacy menu"
            closeLabel="Close pharmacy menu"
            onClick={() => setIsMenuOpen((value) => !value)}
          />
        </Container>

        <CabinetTopBar
          className={css.topbar}
          items={breadcrumbs}
          renderLink={({ href, className, children }) => (
            <Link href={href} className={className}>
              {children}
            </Link>
          )}
          actions={
            <div className={css.userMenuWrap} ref={menuRef}>
              <button
                className={css.userMenuButton}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((value) => !value)}
              >
                <UserBadge
                  className={css.userBadge}
                  variant="dark"
                  name={user?.name}
                  pictureUrl={user?.pictureUrl}
                  fallbackLabel="Profile"
                />
              </button>

              {isUserMenuOpen ? (
                <div className={css.userMenu} role="menu">
                  <Link
                    className={css.userMenuItem}
                    href={getPharmacyProfilePath()}
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserRound size={16} aria-hidden="true" />
                    <span>Profile</span>
                  </Link>

                  <a
                    className={css.userMenuItem}
                    href={CLIENT_APP_URL}
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    <span>Go to site</span>
                  </a>

                  <a
                    className={css.userMenuItem}
                    href={`${CLIENT_APP_URL}/pharmacies`}
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Store size={16} aria-hidden="true" />
                    <span>Go to my pharmacy on site</span>
                  </a>

                  <span className={css.userMenuDivider} aria-hidden="true" />

                  <LogoutButton
                    className={css.logoutButton}
                    isLoading={isLogoutLoading}
                    disabled={isLogoutLoading}
                    tone="inverse"
                    onClick={handleLogout}
                  />
                </div>
              ) : null}
            </div>
          }
        />
      </header>

      <PharmacyMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
