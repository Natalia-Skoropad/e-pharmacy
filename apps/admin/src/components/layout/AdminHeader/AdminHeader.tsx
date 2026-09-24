'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Globe2, LogOut, UserRound } from 'lucide-react';

import { useAuth } from '@e-pharmacy/auth/react';

import {
  BurgerButton,
  CabinetTopBar,
  FullscreenButton,
  UserDropdown,
  type UserDropdownItem,
} from '@e-pharmacy/ui/cabinet';

import { UserBadge } from '@e-pharmacy/ui/data-display';
import type { BreadcrumbItem } from '@e-pharmacy/ui/navigation';
import { TextActionButton } from '@e-pharmacy/ui/primitives';

import { getClientAppDestination } from '@/lib/auth/app-destinations';
import { ADMIN_ROUTES } from '@/lib/routes';

import {
  getAdminNavigationItemByPathname,
  type AdminNavigationItem,
} from '@/lib/layout/navigation';

import { AdminMobileMenu } from '@/components/layout/AdminMobileMenu/AdminMobileMenu';
import { useAdminLogoutController } from '@/components/layout/hooks/useAdminLogoutController';

import css from './AdminHeader.module.css';

//===================================================================

const MOBILE_MENU_ID = 'admin-mobile-menu';
const USER_MENU_ID = 'admin-user-menu';
const DESKTOP_MEDIA_QUERY = '(min-width: 1440px)';

//===================================================================

type AdminHeaderProps = Readonly<{
  breadcrumbs: readonly BreadcrumbItem[];
  navigation: readonly AdminNavigationItem[];
}>;

//===================================================================

export function AdminHeader({ breadcrumbs, navigation }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isLogoutPending, logoutFromAdmin } = useAdminLogoutController(logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItem = getAdminNavigationItemByPathname(pathname, navigation);
  const clientDestination = getClientAppDestination();

  const websiteHref = clientDestination.ok
    ? clientDestination.config.destinationUrl
    : null;

  const userMenuItems: readonly UserDropdownItem[] = [
    {
      type: 'link',
      label: 'Profile',
      href: ADMIN_ROUTES.PROFILE,
      icon: <UserRound size={18} aria-hidden="true" />,
    },
    websiteHref
      ? {
          type: 'link',
          label: 'Go to the website',
          href: websiteHref,
          external: true,
          icon: <Globe2 size={18} aria-hidden="true" />,
        }
      : {
          type: 'status',
          label: 'Website unavailable',
          icon: <Globe2 size={18} aria-hidden="true" />,
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
      onSelect: logoutFromAdmin,
    },
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const closeMobileMenu = () => {
      if (mediaQuery.matches) setIsMenuOpen(false);
    };

    mediaQuery.addEventListener('change', closeMobileMenu);

    return () => {
      mediaQuery.removeEventListener('change', closeMobileMenu);
    };
  }, []);

  return (
    <>
      <header className={css.header}>
        <CabinetTopBar
          className={css.topbar}
          items={breadcrumbs}
          leadingIcon={navigationItem?.icon ?? null}
          navigationToggle={
            <BurgerButton
              controlsId={MOBILE_MENU_ID}
              isOpen={isMenuOpen}
              variant="light"
              openLabel="Open admin menu"
              closeLabel="Close admin menu"
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
                triggerLabel="Open admin account menu"
                trigger={
                  <UserBadge
                    className={css.userBadge}
                    variant="dark"
                    name={user?.name}
                    email={user?.email}
                    pictureUrl={user?.pictureUrl}
                    fallbackLabel="Admin"
                    meta="Admin cabinet"
                  />
                }
              />
            </div>
          }
        />
      </header>

      <AdminMobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMenuOpen}
        items={navigation}
        websiteHref={websiteHref}
        isLogoutPending={isLogoutPending}
        onClose={() => setIsMenuOpen(false)}
        onLogout={logoutFromAdmin}
      />
    </>
  );
}
