'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

import {
  ButtonLink,
  CloseIconButton,
  LogoutButton,
} from '@e-pharmacy/ui/primitives';

import { Logo } from '@e-pharmacy/ui/media';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/overlays';

import { ROUTES, isActiveRoute } from '@/lib/routes';
import { getPharmacyDashboardUrl } from '@/lib/auth';

import { CLIENT_NAV_LINKS } from '@/components/layout/config/navigation';
import { usePublicAuthActionsState } from '@/components/layout/hooks/usePublicAuthActionsState';

import css from './MobileOffcanvas.module.css';

//===================================================================

type MobileOffcanvasProps = {
  id: string;
  isOpen: boolean;
  onClose: () => void;
};

//===================================================================

function MobileOffcanvas({ id, isOpen, onClose }: MobileOffcanvasProps) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathnameRef = useRef(pathname);

  const {
    user,
    logout,
    isAuthReady,
    shouldShowGuestActions,
    shouldShowClientActions,
    shouldShowPharmacyActions,
    shouldShowAuthenticatedActions,
  } = usePublicAuthActionsState();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      onClose();
      router.replace(ROUTES.HOME);
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
      title="Mobile navigation"
      onClose={onClose}
      classNames={{
        backdrop: css.backdrop,
        backdropOpen: css.open,
        panel: css.panel,
      }}
    >
      <div className={css.head}>
        <Logo variant="white" />

        <CloseIconButton
          className={css.closeButton}
          variant="light"
          label="Close menu"
          onClick={onClose}
        />
      </div>

      <nav className={css.nav} aria-label="Mobile main navigation">
        <ul className={css.navList}>
          {CLIENT_NAV_LINKS.map(({ label, href }) => {
            const isActive = isActiveRoute(pathname, href);

            return (
              <li key={href}>
                <Link
                  className={clsx(css.navLink, isActive && css.active)}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={css.actions}>
        {!isAuthReady ? (
          <div className={css.authSkeleton} aria-hidden="true" />
        ) : null}

        {shouldShowClientActions ? (
          <UserBadge
            href={ROUTES.PROFILE}
            name={user?.name}
            pictureUrl={user?.pictureUrl}
            variant="dark"
            onClick={onClose}
          />
        ) : null}

        {shouldShowPharmacyActions ? (
          <ButtonLink
            href={getPharmacyDashboardUrl()}
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Pharmacy cabinet
          </ButtonLink>
        ) : null}

        {shouldShowAuthenticatedActions ? (
          <LogoutButton
            fullWidth
            tone="inverse"
            isLoading={isLogoutLoading}
            disabled={isLogoutLoading}
            onClick={handleLogout}
          />
        ) : null}

        {shouldShowGuestActions ? (
          <>
            <ButtonLink
              className={css.loginLink}
              href={ROUTES.LOGIN}
              variant="primary"
              fullWidth
            >
              Log in
            </ButtonLink>

            <ButtonLink
              className={css.registerLink}
              href={ROUTES.REGISTER}
              variant="secondary"
              fullWidth
            >
              Register
            </ButtonLink>
          </>
        ) : null}
      </div>
    </MobileOffcanvasBase>
  );
}

export default MobileOffcanvas;
