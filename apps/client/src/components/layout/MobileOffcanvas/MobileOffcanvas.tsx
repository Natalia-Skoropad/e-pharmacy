'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';

import { Button, ButtonLink, Logo } from '@/components/common';
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
  const router = useRouter();
  const previousPathnameRef = useRef(pathname);

  const { isAuthenticated, isAuthReady, user, logout } = useAuth();

  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleBackdropClick = useBackdropClick({ onClose });

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

  useEscapeToClose({ isOpen, onClose });
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

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
            <X size={24} strokeWidth={2} aria-hidden="true" />
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
          {!isAuthReady ? (
            <div className={css.authSkeleton} aria-hidden="true" />
          ) : null}

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
