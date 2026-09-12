'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Globe2, Store } from 'lucide-react';

import { CloseIconButton, LogoutButton } from '@e-pharmacy/ui/primitives';
import { Logo } from '@e-pharmacy/ui/media';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/overlays';
import { SideMenu } from '@e-pharmacy/ui/cabinet';
import { useAuth } from '@e-pharmacy/auth/react';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getClientAppUrl } from '@/lib/layout/external-links';
import { getPublicPharmacyLinkState } from '@/lib/layout/public-pharmacy-link-state';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import { shouldCloseMobileMenuForPathnameChange } from './mobile-menu-route-lifecycle';

import css from './PharmacyMobileMenu.module.css';

//===================================================================

type PharmacyMobileMenuProps = Readonly<{
  id: string;
  isOpen: boolean;
  isLogoutPending: boolean;
  onClose: () => void;
  onLogout: (onSettled?: () => void) => Promise<void>;
}>;

//===================================================================

export function PharmacyMobileMenu({
  id,
  isOpen,
  isLogoutPending,
  onClose,
  onLogout,
}: PharmacyMobileMenuProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const { user } = useAuth();

  const {
    profile: pharmacyProfile,
    isLoading: isPharmacyProfileLoading,
    error: pharmacyProfileError,
  } = usePharmacyProfile();

  const clientAppUrl = getClientAppUrl();

  const publicPharmacyLink = getPublicPharmacyLinkState({
    profile: pharmacyProfile,
    isLoading: isPharmacyProfileLoading,
    error: pharmacyProfileError,
  });

  useEffect(() => {
    if (
      !shouldCloseMobileMenuForPathnameChange(
        previousPathnameRef.current,
        pathname
      )
    ) {
      return;
    }

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
          href={PHARMACY_ROUTES.DASHBOARD}
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
        items={PHARMACY_NAVIGATION}
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

        {publicPharmacyLink.status === 'available' ? (
          <a
            className={css.quickLink}
            href={publicPharmacyLink.href}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Store size={23} aria-hidden="true" />
            <span>{publicPharmacyLink.label}</span>
          </a>
        ) : (
          <span
            className={`${css.quickLink} ${css.quickLinkDisabled}`}
            aria-disabled="true"
            aria-busy={publicPharmacyLink.status === 'loading' || undefined}
          >
            <Store size={23} aria-hidden="true" />
            <span>{publicPharmacyLink.label}</span>
          </span>
        )}
      </div>

      <div className={css.actions}>
        <UserBadge
          href={PHARMACY_ROUTES.PROFILE}
          name={user?.name}
          pictureUrl={user?.pictureUrl}
          fallbackLabel="Profile"
          variant="dark"
          onClick={onClose}
        />

        <LogoutButton
          fullWidth
          tone="inverse"
          isLoading={isLogoutPending}
          disabled={isLogoutPending}
          onClick={() => void onLogout(onClose)}
        />
      </div>
    </MobileOffcanvasBase>
  );
}
