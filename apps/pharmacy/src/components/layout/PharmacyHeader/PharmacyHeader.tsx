'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  Globe2,
  LogOut,
  Maximize2,
  Minimize2,
  Store,
  UserRound,
} from 'lucide-react';

import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';
import { BurgerButton, CabinetTopBar } from '@e-pharmacy/ui/cabinet';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { useAuth } from '@e-pharmacy/auth/react';
import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getClientAppUrl } from '@/lib/layout/external-links';
import { getPublicPharmacyLinkState } from '@/lib/layout/public-pharmacy-link-state';
import { getPharmacyNavigationItemByPathname } from '@/lib/layout/navigation';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import {
  isFullscreenAvailable,
  toggleFullscreen,
} from '@/lib/layout/fullscreen';

import { PharmacyMobileMenu } from '@/components/layout/PharmacyMobileMenu/PharmacyMobileMenu';
import { subscribeToDesktopBreakpoint } from '@/components/layout/hooks/desktop-breakpoint-lifecycle';
import { usePharmacyLogoutController } from '@/components/layout/hooks/usePharmacyLogoutController';

import css from './PharmacyHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'pharmacy-mobile-menu';
const USER_MENU_ID = 'pharmacy-user-menu';
const DESKTOP_MEDIA_QUERY = '(min-width: 1440px)';

//===================================================================

type PharmacyHeaderProps = Readonly<{
  breadcrumbs: readonly BreadcrumbItem[];
}>;

//===================================================================

export function PharmacyHeader({ breadcrumbs }: PharmacyHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const {
    profile: pharmacyProfile,
    isLoading: isPharmacyProfileLoading,
    error: pharmacyProfileError,
  } = usePharmacyProfile();

  const { isLogoutPending, logoutFromPharmacy } =
    usePharmacyLogoutController(logout);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false);

  const topBarIcon =
    getPharmacyNavigationItemByPathname(pathname)?.icon ?? null;
  const clientAppUrl = getClientAppUrl();

  const publicPharmacyLink = getPublicPharmacyLinkState({
    profile: pharmacyProfile,
    isLoading: isPharmacyProfileLoading,
    error: pharmacyProfileError,
  });

  const handleFullscreenToggle = async () => {
    await toggleFullscreen(document);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenSupported(isFullscreenAvailable(document));
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    return subscribeToDesktopBreakpoint(mediaQuery, () => {
      setIsMenuOpen(false);
    });
  }, []);

  useOutsidePointerDown({
    refs: [menuRef],
    enabled: isUserMenuOpen,
    onOutside: () => setIsUserMenuOpen(false),
  });

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <header className={css.header}>
        <CabinetTopBar
          className={css.topbar}
          items={breadcrumbs}
          leadingIcon={topBarIcon}
          navigationToggle={
            <BurgerButton
              controlsId={MOBILE_MENU_ID}
              isOpen={isMenuOpen}
              variant="light"
              openLabel="Open pharmacy menu"
              closeLabel="Close pharmacy menu"
              onClick={() => setIsMenuOpen((value) => !value)}
            />
          }
          renderLink={({ href, className, children }) => (
            <TextActionButton className={className} href={href} variant="light">
              {children}
            </TextActionButton>
          )}
          actions={
            <div className={css.actionsGroup}>
              {isFullscreenSupported ? (
                <button
                  className={css.fullscreenButton}
                  type="button"
                  aria-label={
                    isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                  }
                  onClick={() => void handleFullscreenToggle()}
                >
                  {isFullscreen ? (
                    <Minimize2 size={18} aria-hidden="true" />
                  ) : (
                    <Maximize2 size={18} aria-hidden="true" />
                  )}
                </button>
              ) : null}

              <div className={css.userMenuWrap} ref={menuRef}>
                <button
                  ref={userMenuButtonRef}
                  className={css.userMenuButton}
                  type="button"
                  aria-expanded={isUserMenuOpen}
                  aria-controls={isUserMenuOpen ? USER_MENU_ID : undefined}
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
                  <div className={css.userMenu} id={USER_MENU_ID}>
                    <Link
                      className={css.userMenuItem}
                      href={PHARMACY_ROUTES.PROFILE}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserRound size={18} aria-hidden="true" />
                      <span>Go to profile</span>
                    </Link>

                    <span className={css.userMenuDivider} aria-hidden="true" />

                    <a
                      className={css.userMenuItem}
                      href={clientAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Globe2 size={18} aria-hidden="true" />
                      <span>Go to the website</span>
                    </a>

                    {publicPharmacyLink.status === 'available' ? (
                      <a
                        className={css.userMenuItem}
                        href={publicPharmacyLink.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Store size={18} aria-hidden="true" />
                        <span>{publicPharmacyLink.label}</span>
                      </a>
                    ) : (
                      <span
                        className={`${css.userMenuItem} ${css.userMenuItemDisabled}`}
                        aria-disabled="true"
                        aria-busy={
                          publicPharmacyLink.status === 'loading' || undefined
                        }
                      >
                        <Store size={18} aria-hidden="true" />
                        <span>{publicPharmacyLink.label}</span>
                      </span>
                    )}

                    <span className={css.userMenuDivider} aria-hidden="true" />

                    <button
                      className={css.logoutButton}
                      type="button"
                      disabled={isLogoutPending}
                      aria-busy={isLogoutPending || undefined}
                      onClick={() =>
                        void logoutFromPharmacy(() => setIsUserMenuOpen(false))
                      }
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>
                        {isLogoutPending ? 'Logging out...' : 'Log out'}
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />
      </header>

      <PharmacyMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        isLogoutPending={isLogoutPending}
        onClose={() => setIsMenuOpen(false)}
        onLogout={logoutFromPharmacy}
      />
    </>
  );
}
