'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Globe2, Store } from 'lucide-react';

import { CloseIconButton, LogoutButton } from '@e-pharmacy/ui/primitives';
import { Logo } from '@e-pharmacy/ui/media';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/overlays';
import { SideMenu } from '@e-pharmacy/ui/cabinet';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  getPharmacyDashboardPath,
  getPharmacyProfilePath,
} from '@e-pharmacy/config/pharmacy';

import { getSharedLoginUrl } from '@/lib/auth/shared-auth';

import {
  canOpenClientPharmacyPage,
  getClientAppUrl,
  getClientPharmacyUrl,
} from '@/lib/layout/external-links';

import { PHARMACY_MOBILE_NAVIGATION } from '@/lib/layout/navigation';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

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
  const { profile: pharmacyProfile } = usePharmacyProfile();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const clientAppUrl = getClientAppUrl();
  const clientPharmacyUrl = getClientPharmacyUrl(pharmacyProfile);
  const canOpenPharmacyWebsite =
    canOpenClientPharmacyPage(pharmacyProfile?.status) &&
    Boolean(clientPharmacyUrl);

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

      <div className={css.quickLinks} aria-label="Website quick links">
        <span className={css.quickLinksDivider} aria-hidden="true" />

        <a
          className={css.quickLink}
          href={clientAppUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
        >
          <Globe2 size={23} aria-hidden="true" />
          <span>Go to the website</span>
        </a>

        {canOpenPharmacyWebsite ? (
          <a
            className={css.quickLink}
            href={clientPharmacyUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Store size={23} aria-hidden="true" />
            <span>Go to my pharmacy on the website</span>
          </a>
        ) : (
          <span className={`${css.quickLink} ${css.quickLinkDisabled}`}>
            <Store size={23} aria-hidden="true" />
            <span>Go to my pharmacy on the website</span>
          </span>
        )}
      </div>

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
