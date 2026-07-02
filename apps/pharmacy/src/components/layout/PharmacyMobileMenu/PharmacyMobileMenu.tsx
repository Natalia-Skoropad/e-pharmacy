'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  CloseIconButton,
  Logo,
  LogoutButton,
  UserBadge,
} from '@e-pharmacy/ui/common';

import { MobileOffcanvasBase, SideMenu } from '@e-pharmacy/ui/layout';
import { useAuth } from '@e-pharmacy/auth/core';

import { PHARMACY_MOBILE_NAVIGATION } from '@/lib/layout/navigation';

import {
  getPharmacyDashboardPath,
  getPharmacyProfilePath,
} from '@/lib/layout/routes';

import { getSharedLoginUrl } from '@/lib/auth/shared-auth';

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
  const previousPathnameRef = useRef(pathname);
  const { user, logout } = useAuth();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      onClose();
      window.location.assign(getSharedLoginUrl());
    } finally {
      setIsLogoutLoading(false);
    }
  };

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

  return (
    <MobileOffcanvasBase
      id={id}
      isOpen={isOpen}
      title="Pharmacy navigation"
      onClose={onClose}
      classNames={{
        backdrop: css.backdrop,
        backdropOpen: css.open,
        panel: css.panel,
      }}
    >
      <div className={css.head}>
        <Logo
          variant="white"
          href={getPharmacyDashboardPath()}
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

        <CloseIconButton
          className={css.closeButton}
          variant="light"
          label="Close menu"
          onClick={onClose}
        />
      </div>

      <SideMenu
        className={css.menu}
        items={PHARMACY_MOBILE_NAVIGATION}
        activePath={pathname}
        ariaLabel="Mobile pharmacy navigation"
        showChevron={false}
        onNavigate={onClose}
      />

      <div className={css.actions}>
        <UserBadge
          href={getPharmacyProfilePath()}
          name={user?.name}
          pictureUrl={user?.pictureUrl}
          fallbackLabel="Profile"
          variant="dark"
          onClick={onClose}
        />

        <LogoutButton
          fullWidth
          tone="inverse"
          isLoading={isLogoutLoading}
          disabled={isLogoutLoading}
          onClick={handleLogout}
        />
      </div>
    </MobileOffcanvasBase>
  );
}
