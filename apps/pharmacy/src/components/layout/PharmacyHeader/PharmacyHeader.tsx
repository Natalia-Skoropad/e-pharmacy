'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  Boxes,
  ClipboardList,
  FilePlus2,
  Globe2,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Minimize2,
  PackageSearch,
  ShoppingBag,
  Store,
  UserRound,
  Users,
} from 'lucide-react';

import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';
import { BurgerButton } from '@e-pharmacy/ui/cabinet';
import { CabinetTopBar } from '@e-pharmacy/ui/cabinet';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { useAuth } from '@e-pharmacy/auth/react';
import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';
import { PHARMACY_ROUTES } from '@/lib/routes';

import { getSharedLoginUrl } from '@/lib/auth/shared-auth';

import {
  canOpenClientPharmacyPage,
  getClientAppUrl,
  getClientPharmacyUrl,
} from '@/lib/layout/external-links';

import { PharmacyMobileMenu } from '@/components/layout/PharmacyMobileMenu/PharmacyMobileMenu';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import css from './PharmacyHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'pharmacy-mobile-menu';
const TOPBAR_ICON_SIZE = 19;

//===================================================================

type PharmacyHeaderProps = Readonly<{
  breadcrumbs: readonly BreadcrumbItem[];
}>;

//===================================================================

function getTopBarIcon(label?: string) {
  if (label === 'Dashboard') {
    return <LayoutDashboard size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'Orders') {
    return <ShoppingBag size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'Clients') {
    return <Users size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'Own products') {
    return <Boxes size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'All products') {
    return <PackageSearch size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'Product requests') {
    return <FilePlus2 size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  if (label === 'Pharmacy profile') {
    return <ClipboardList size={TOPBAR_ICON_SIZE} aria-hidden="true" />;
  }

  return null;
}

//===================================================================

export function PharmacyHeader({ breadcrumbs }: PharmacyHeaderProps) {
  const { user, logout } = useAuth();
  const { profile: pharmacyProfile } = usePharmacyProfile();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const topBarIcon = getTopBarIcon(breadcrumbs[0]?.label);
  const clientAppUrl = getClientAppUrl();
  const clientPharmacyUrl = getClientPharmacyUrl(pharmacyProfile);
  const canOpenPharmacyWebsite =
    canOpenClientPharmacyPage(pharmacyProfile?.status) &&
    Boolean(clientPharmacyUrl);

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      window.location.assign(getSharedLoginUrl());
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleFullscreenToggle = async () => {
    if (!document.documentElement.requestFullscreen) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('[pharmacy-header] Failed to toggle fullscreen', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
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
              <button
                className={css.fullscreenButton}
                type="button"
                aria-label={
                  isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                }
                onClick={handleFullscreenToggle}
              >
                {isFullscreen ? (
                  <Minimize2 size={18} aria-hidden="true" />
                ) : (
                  <Maximize2 size={18} aria-hidden="true" />
                )}
              </button>

              <div className={css.userMenuWrap} ref={menuRef}>
                <button
                  className={css.userMenuButton}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
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
                  <div className={css.userMenu} role="menu">
                    <Link
                      className={css.userMenuItem}
                      href={PHARMACY_ROUTES.PROFILE}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserRound size={18} aria-hidden="true" />
                      <span>Go to profile</span>
                    </Link>

                    <span className={css.userMenuDivider} aria-hidden="true" />

                    <a
                      className={css.userMenuItem}
                      href={clientAppUrl}
                      role="menuitem"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Globe2 size={18} aria-hidden="true" />
                      <span>Go to the website</span>
                    </a>

                    {canOpenPharmacyWebsite ? (
                      <a
                        className={css.userMenuItem}
                        href={clientPharmacyUrl}
                        role="menuitem"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Store size={18} aria-hidden="true" />
                        <span>Go to my pharmacy on the website</span>
                      </a>
                    ) : (
                      <span
                        className={`${css.userMenuItem} ${css.userMenuItemDisabled}`}
                        role="menuitem"
                        aria-disabled="true"
                      >
                        <Store size={18} aria-hidden="true" />
                        <span>Go to my pharmacy on the website</span>
                      </span>
                    )}

                    <span className={css.userMenuDivider} aria-hidden="true" />

                    <button
                      className={css.logoutButton}
                      type="button"
                      disabled={isLogoutLoading}
                      aria-busy={isLogoutLoading || undefined}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>
                        {isLogoutLoading ? 'Logging out...' : 'Log out'}
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
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
