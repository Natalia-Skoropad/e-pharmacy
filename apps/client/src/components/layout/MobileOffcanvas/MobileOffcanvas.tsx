'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button, ButtonLink, Logo, SvgIcon } from '@/components/common';
import { useAuth } from '@/components/providers';

import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@/hooks';

import { CLIENT_NAV_LINKS } from '@/lib/constants/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { isActiveRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

import css from './MobileOffcanvas.module.css';

//===================================================================

type MobileOffcanvasProps = {
  isOpen: boolean;
  onClose: () => void;
};

//===================================================================

function MobileOffcanvas({ isOpen, onClose }: MobileOffcanvasProps) {
  const pathname = usePathname();
  const { isAuthenticated, isAuthReady, user, logout } = useAuth();

  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleBackdropClick = useBackdropClick({ onClose });

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      onClose();
    } finally {
      setIsLogoutLoading(false);
    }
  };

  useEscapeToClose({ isOpen, onClose });
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    onClose();
  }, [isOpen, onClose, pathname]);

  return (
    <div
      className={cn(css.backdrop, isOpen && css.open)}
      aria-hidden={!isOpen}
      onClick={handleBackdropClick}
    >
      <aside
        className={css.panel}
        id="mobile-navigation"
        aria-label="Mobile navigation"
      >
        <div className={css.head}>
          <Logo />

          <button
            className={css.closeButton}
            type="button"
            aria-label="Close menu"
            onClick={onClose}
          >
            <SvgIcon name="icon-close" size={24} />
          </button>
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
          {isAuthReady && isAuthenticated ? (
            <>
              <ButtonLink href={ROUTES.PROFILE} variant="ghost" fullWidth>
                {user?.name ?? 'Profile'}
              </ButtonLink>

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
              <ButtonLink href={ROUTES.LOGIN} variant="ghost" fullWidth>
                Log in
              </ButtonLink>

              <ButtonLink href={ROUTES.REGISTER} fullWidth>
                Register
              </ButtonLink>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default MobileOffcanvas;
