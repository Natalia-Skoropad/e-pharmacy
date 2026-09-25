'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Globe2 } from 'lucide-react';

import { useAuth } from '@e-pharmacy/auth/react';
import { SideMenu } from '@e-pharmacy/ui/cabinet';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { Logo } from '@e-pharmacy/ui/media';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/overlays';
import { CloseIconButton, LogoutButton } from '@e-pharmacy/ui/primitives';

import type { AdminNavigationItem } from '@/lib/layout/navigation';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './AdminMobileMenu.module.css';

//===================================================================

type AdminMobileMenuProps = Readonly<{
  id: string;
  items: readonly AdminNavigationItem[];
  isOpen: boolean;
  websiteHref: string | null;
  isLogoutPending: boolean;
  onClose: () => void;
  onLogout: (onSettled?: () => void) => Promise<void>;
}>;

//===================================================================

export function AdminMobileMenu({
  id,
  items,
  isOpen,
  websiteHref,
  isLogoutPending,
  onClose,
  onLogout,
}: AdminMobileMenuProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const { user } = useAuth();

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;

    if (isOpen) onClose();
  }, [isOpen, onClose, pathname]);

  return (
    <MobileOffcanvasBase
      id={id}
      isOpen={isOpen}
      title="Admin navigation"
      onClose={onClose}
      classNames={{
        backdrop: css.backdrop,
        backdropOpen: css.open,
        panel: css.panel,
      }}
    >
      <div className={css.head}>
        <Logo
          variant="white"
          href={ADMIN_ROUTES.DASHBOARD}
          ariaLabel="E-PHARMACY admin dashboard"
          renderLink={({ href, className, children, ...props }) => (
            <Link
              href={href}
              className={className}
              {...props}
              onClick={onClose}
            >
              {children}
            </Link>
          )}
        />

        <CloseIconButton
          className={css.closeButton}
          variant="light"
          label="Close menu"
          onClick={onClose}
        />
      </div>

      <SideMenu
        className={css.menu}
        items={items}
        activePath={pathname}
        ariaLabel="Mobile admin navigation"
        showChevron={false}
        onNavigate={onClose}
        renderLink={({ href, className, children, ...props }) => (
          <Link href={href} className={className} {...props}>
            {children}
          </Link>
        )}
      />

      <div className={css.quickLinks} aria-label="Account quick links">
        <span className={css.quickLinksDivider} aria-hidden="true" />

        {websiteHref ? (
          <a
            className={css.quickLink}
            href={websiteHref}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Globe2 size={23} aria-hidden="true" />
            <span>Go to the website</span>
          </a>
        ) : (
          <span
            className={`${css.quickLink} ${css.quickLinkDisabled}`}
            aria-disabled="true"
          >
            <Globe2 size={23} aria-hidden="true" />
            <span>Website unavailable</span>
          </span>
        )}
      </div>

      <div className={css.actions}>
        <UserBadge
          href={ADMIN_ROUTES.PROFILE}
          name={user?.name}
          pictureUrl={user?.pictureUrl}
          fallbackLabel="Profile"
          variant="dark"
          onClick={onClose}
        />

        <LogoutButton
          fullWidth
          tone="inverse"
          isLoading={isLogoutPending}
          disabled={isLogoutPending}
          onClick={() => void onLogout(onClose)}
        />
      </div>
    </MobileOffcanvasBase>
  );
}
