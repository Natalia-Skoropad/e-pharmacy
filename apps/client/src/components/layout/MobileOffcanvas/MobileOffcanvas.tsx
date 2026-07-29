'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

import { Button, CloseIconButton, LogoutButton } from '@e-pharmacy/ui/primitives';

import { LinkButton } from '@e-pharmacy/ui/navigation';
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

  const authActions = usePublicAuthActionsState();
  const isClientMode = authActions.mode === 'authenticated-client';
  const isPharmacyMode = authActions.mode === 'authenticated-pharmacy';
  const pharmacyDashboardUrl = isPharmacyMode
    ? getPharmacyDashboardUrl()
    : null;
  const logoutAction =
    'logout' in authActions ? authActions.logout : null;
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleLogout = async () => {
    if (!logoutAction) return;

    try {
      setIsLogoutLoading(true);
      await logoutAction();
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
        {authActions.mode === 'loading' ? (
          <div className={css.authSkeleton} aria-hidden="true" />
        ) : null}

        {authActions.mode === 'unavailable' ? (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => void authActions.retryAuthBootstrap()}
          >
            Retry session
          </Button>
        ) : null}

        {isClientMode ? (
          <UserBadge
            href={ROUTES.PROFILE}
            name={authActions.user.name}
            pictureUrl={authActions.user.pictureUrl}
            variant="dark"
            onClick={onClose}
          />
        ) : null}

        {isPharmacyMode && pharmacyDashboardUrl ? (
          <LinkButton
            href={pharmacyDashboardUrl}
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Pharmacy cabinet
          </LinkButton>
        ) : null}

        {isPharmacyMode && !pharmacyDashboardUrl ? (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled
            title="The pharmacy application URL is not configured correctly."
          >
            Pharmacy cabinet unavailable
          </Button>
        ) : null}

        {logoutAction ? (
          <LogoutButton
            fullWidth
            tone="inverse"
            isLoading={isLogoutLoading}
            disabled={isLogoutLoading}
            onClick={handleLogout}
          />
        ) : null}

        {authActions.mode === 'guest' ? (
          <>
            <LinkButton
              className={css.loginLink}
              href={ROUTES.LOGIN}
              variant="primary"
              fullWidth
            >
              Log in
            </LinkButton>

            <LinkButton
              className={css.registerLink}
              href={ROUTES.REGISTER}
              variant="secondary"
              fullWidth
            >
              Register
            </LinkButton>
          </>
        ) : null}
      </div>
    </MobileOffcanvasBase>
  );
}

export default MobileOffcanvas;
