'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import {
  Button,
  ButtonLink,
  CloseIconButton,
  Logo,
  UserBadge,
} from '@/components/common';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
  useFocusTrap,
} from '@e-pharmacy/hooks';

import { CLIENT_NAV_LINKS } from '@/lib/constants/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { isActiveRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

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
  const panelRef = useRef<HTMLElement | null>(null);

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
  useFocusTrap({ isOpen, containerRef: panelRef });

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

  const offcanvas = (
    <div
      className={cn(css.backdrop, isOpen && css.open)}
      aria-hidden={!isOpen}
      onClick={handleBackdropClick}
    >
      <aside
        ref={panelRef}
        className={css.panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <h2 className="visually-hidden" id={`${id}-title`}>
          Mobile navigation
        </h2>
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
      </aside>
    </div>
  );

  const portalRoot = typeof document === 'undefined' ? null : document.body;
  if (!isOpen || !portalRoot) return null;

  return createPortal(offcanvas, portalRoot);
}

export default MobileOffcanvas;
