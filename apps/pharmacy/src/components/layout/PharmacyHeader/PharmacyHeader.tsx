'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Globe2, LogOut, Store, UserRound } from 'lucide-react';

import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';

import {
  BurgerButton,
  CabinetTopBar,
  FullscreenButton,
  UserDropdown,
  type UserDropdownItem,
} from '@e-pharmacy/ui/cabinet';

import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { useAuth } from '@e-pharmacy/auth/react';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getClientAppUrl } from '@/lib/layout/external-links';
import { getPublicPharmacyLinkState } from '@/lib/layout/public-pharmacy-link-state';
import { getPharmacyNavigationItemByPathname } from '@/lib/layout/navigation';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const topBarIcon =
    getPharmacyNavigationItemByPathname(pathname)?.icon ?? null;
  const clientAppUrl = getClientAppUrl();

  const publicPharmacyLink = getPublicPharmacyLinkState({
    profile: pharmacyProfile,
    isLoading: isPharmacyProfileLoading,
    error: pharmacyProfileError,
  });

  const userMenuItems: readonly UserDropdownItem[] = [
    {
      type: 'link',
      label: 'Go to profile',
      href: PHARMACY_ROUTES.PROFILE,
      icon: <UserRound size={18} aria-hidden="true" />,
    },
    { type: 'separator' },
    {
      type: 'link',
      label: 'Go to the website',
      href: clientAppUrl,
      external: true,
      icon: <Globe2 size={18} aria-hidden="true" />,
    },
    publicPharmacyLink.status === 'available'
      ? {
          type: 'link',
          label: publicPharmacyLink.label,
          href: publicPharmacyLink.href,
          external: true,
          icon: <Store size={18} aria-hidden="true" />,
        }
      : {
          type: 'status',
          label: publicPharmacyLink.label,
          ariaBusy: publicPharmacyLink.status === 'loading',
          icon: <Store size={18} aria-hidden="true" />,
        },
    { type: 'separator' },
    {
      type: 'action',
      label: 'Log out',
      pendingLabel: 'Logging out...',
      icon: <LogOut size={16} aria-hidden="true" />,
      destructive: true,
      disabled: isLogoutPending,
      isPending: isLogoutPending,
      onSelect: logoutFromPharmacy,
    },
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    return subscribeToDesktopBreakpoint(mediaQuery, () => {
      setIsMenuOpen(false);
    });
  }, []);

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
              <span className={css.fullscreenDesktop}>
                <FullscreenButton />
              </span>

              <UserDropdown
                id={USER_MENU_ID}
                className={css.userDropdownDesktop}
                items={userMenuItems}
                trigger={
                  <UserBadge
                    className={css.userBadge}
                    variant="dark"
                    name={user?.name}
                    pictureUrl={user?.pictureUrl}
                    fallbackLabel="Profile"
                  />
                }
              />
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
