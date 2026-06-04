'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Button,
  ButtonLink,
  CloseIconButton,
  Logo,
  UserBadge,
} from '@e-pharmacy/ui/common';

import { MobileOffcanvasBase } from '@e-pharmacy/ui/layout';
import { CLIENT_NAV_LINKS } from '@e-pharmacy/config/navigation';
import { ROUTES } from '@e-pharmacy/config/routes';
import { isActiveRoute } from '@e-pharmacy/config/routes';
import { cn } from '@e-pharmacy/utils/classes';
import { useAuth } from '@/providers';

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

  const { isAuthenticated, isAuthReady, user, logout } = useAuth();
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
                  className={cn(css.navLink, isActive && css.active)}
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

        {isAuthReady && isAuthenticated ? (
          <>
            <UserBadge
              href={ROUTES.PROFILE}
              name={user?.name}
              avatarUrl={user?.avatarUrl}
              variant="dark"
              onClick={onClose}
            />

            <Button
              variant="secondary"
              fullWidth
              disabled={isLogoutLoading}
              onClick={handleLogout}
            >
              {isLogoutLoading ? 'Logging out...' : 'Log out'}
            </Button>
          </>
        ) : null}

        {isAuthReady && !isAuthenticated ? (
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
