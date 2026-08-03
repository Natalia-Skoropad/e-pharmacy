'use client';

import Link from 'next/link';
import clsx from 'clsx';

import {
  Button,
  CloseIconButton,
  LogoutButton,
} from '@e-pharmacy/ui/primitives';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Logo } from '@e-pharmacy/ui/media';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { MobileOffcanvasBase } from '@e-pharmacy/ui/overlays';

import { ROUTES, isActiveRoute } from '@/lib/routes';
import { MOBILE_MAIN_NAV_ITEMS } from '@/components/layout/config/navigation';
import { INFO_SIDE_MENU_ITEMS } from '@/components/info/config/navigation';
import type { usePublicHeaderController } from '@/components/layout/hooks/usePublicHeaderController';

import css from './MobileOffcanvas.module.css';

//===================================================================

type PublicHeaderController = ReturnType<typeof usePublicHeaderController>;

export type MobileOffcanvasProps = Readonly<{
  id: string;
  isOpen: boolean;
  pathname: string;
  controller: PublicHeaderController;
  onClose: () => void;
}>;

//===================================================================

function MobileOffcanvas({
  id,
  isOpen,
  pathname,
  controller,
  onClose,
}: MobileOffcanvasProps) {
  const authState = controller.authState;
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
        <Logo
          variant="white"
          renderLink={(props) => <Link {...props} onClick={onClose} />}
        />

        <CloseIconButton
          className={css.closeButton}
          variant="light"
          label="Close menu"
          onClick={onClose}
        />
      </div>

      <nav className={css.menuSection} aria-label="Mobile main navigation">
        <p className={css.menuTitle}>Main menu</p>
        <ul className={css.menuList}>
          {MOBILE_MAIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = isActiveRoute(pathname, href);

            return (
              <li key={href}>
                <Link
                  className={clsx(css.menuLink, isActive && css.activeMenuLink)}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onClose}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className={css.menuSection} aria-label="Information pages">
        <p className={css.menuTitle}>Information</p>
        <ul className={css.menuList}>
          {INFO_SIDE_MENU_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = href === pathname;

            return (
              <li key={href}>
                <Link
                  className={clsx(css.menuLink, isActive && css.activeMenuLink)}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onClose}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={css.actions}>
        {authState.mode === 'loading' ? (
          <>
            <span className="visually-hidden" role="status">
              Checking your session
            </span>
            <div className={css.authSkeleton} aria-hidden="true" />
          </>
        ) : null}

        {authState.mode === 'unavailable' ? (
          <div className={css.statusGroup}>
            <p>Session check is temporarily unavailable.</p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => void authState.retryAuthBootstrap()}
            >
              Retry session check
            </Button>
          </div>
        ) : null}

        {authState.mode === 'authenticated-client' ? (
          <UserBadge
            href={ROUTES.PROFILE}
            name={authState.user.name}
            pictureUrl={authState.user.pictureUrl}
            variant="dark"
            onClick={onClose}
          />
        ) : null}

        {controller.isPharmacyMode && controller.pharmacyDashboardUrl ? (
          <LinkButton
            href={controller.pharmacyDashboardUrl}
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Pharmacy cabinet
          </LinkButton>
        ) : null}

        {controller.isPharmacyMode && !controller.pharmacyDashboardUrl ? (
          <Button type="button" variant="secondary" fullWidth disabled>
            Pharmacy cabinet unavailable
          </Button>
        ) : null}

        {authState.mode === 'blocked-account' ? (
          <p className={css.accountNotice}>Account access is blocked.</p>
        ) : null}

        {authState.mode === 'authenticated-admin' ? (
          <p className={css.accountNotice}>
            Use the admin application for account tools.
          </p>
        ) : null}

        {authState.mode === 'authenticated-unsupported' ? (
          <p className={css.accountNotice}>
            This account is not supported in the client application.
          </p>
        ) : null}

        {'logout' in authState ? (
          <LogoutButton
            fullWidth
            tone="inverse"
            isLoading={controller.isLogoutPending}
            disabled={controller.isLogoutPending}
            onClick={() => void controller.logout(onClose)}
          />
        ) : null}

        {authState.mode === 'guest' ? (
          <>
            <LinkButton
              className={css.loginLink}
              href={ROUTES.LOGIN}
              variant="primary"
              fullWidth
              onClick={onClose}
            >
              Log in
            </LinkButton>

            <LinkButton
              className={css.registerLink}
              href={ROUTES.REGISTER}
              variant="secondary"
              fullWidth
              onClick={onClose}
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
