'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import clsx from 'clsx';

import { Button, LogoutButton } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Logo } from '@e-pharmacy/ui/media';
import { UserBadge } from '@e-pharmacy/ui/data-display';
import { Container } from '@e-pharmacy/ui/layout';
import { BurgerButton } from '@e-pharmacy/ui/cabinet';
import { formatCountLabel } from '@e-pharmacy/utils/numbers';

import { ROUTES, isActiveRoute } from '@/lib/routes';
import { useCart } from '@/providers/CartProvider';

import { subscribeToDesktopBreakpoint } from '@/components/layout/hooks/desktop-breakpoint-lifecycle';
import { usePublicHeaderController } from '@/components/layout/hooks/usePublicHeaderController';
import { CLIENT_NAV_LINKS } from '@/components/layout/config/navigation';
import MobileOffcanvas from '@/components/layout/MobileOffcanvas/MobileOffcanvas';

import css from './Header.module.css';

//===================================================================

function Header() {
  const pathname = usePathname();
  const mobileNavigationId = useId();
  const controller = usePublicHeaderController();
  const authState = controller.authState;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart } = useCart();

  const visibleCartItemsCount = controller.isClientMode ? cart.totalItems : 0;
  const cartCountLabel =
    formatCountLabel(visibleCartItemsCount, 'item') ?? 'items unavailable';

  useEffect(
    () =>
      subscribeToDesktopBreakpoint(
        window.matchMedia('(min-width: 1440px)'),
        () => setIsMobileMenuOpen(false)
      ),
    []
  );

  const handleCloseMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={css.header}>
      <Container className={css.container}>
        <Logo />

        <nav className={css.nav} aria-label="Main navigation">
          <ul className={css.navList}>
            {CLIENT_NAV_LINKS.map(({ label, href }) => {
              const isActive = isActiveRoute(pathname, href);

              return (
                <li key={href}>
                  <Link
                    className={clsx(css.navLink, isActive && css.active)}
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
          {controller.isClientMode ? (
            <LinkButton
              className={css.cartLink}
              href={ROUTES.CART}
              variant="ghost"
              size="sm"
              aria-label={`Cart with ${cartCountLabel}`}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span className={css.cartText}>Cart</span>
              <span className={css.cartCount}>{visibleCartItemsCount}</span>
            </LinkButton>
          ) : null}

          {authState.mode === 'loading' ? (
            <>
              <span className="visually-hidden" role="status">
                Checking your session
              </span>
              <div className={css.authSkeleton} aria-hidden="true" />
            </>
          ) : null}

          {authState.mode === 'unavailable' ? (
            <div className={css.authStatus}>
              <span className="visually-hidden">Session check unavailable.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void authState.retryAuthBootstrap()}
              >
                Retry session check
              </Button>
            </div>
          ) : null}

          {authState.mode === 'authenticated-client' ? (
            <UserBadge
              className={css.profileLink}
              href={ROUTES.PROFILE}
              name={authState.user.name}
              pictureUrl={authState.user.pictureUrl}
            />
          ) : null}

          {controller.isPharmacyMode && controller.pharmacyDashboardUrl ? (
            <LinkButton
              className={css.pharmacyCabinetLink}
              href={controller.pharmacyDashboardUrl}
              variant="secondary"
              size="sm"
            >
              Pharmacy cabinet
            </LinkButton>
          ) : null}

          {controller.isPharmacyMode && !controller.pharmacyDashboardUrl ? (
            <Button type="button" variant="secondary" size="sm" disabled>
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
              isLoading={controller.isLogoutPending}
              disabled={controller.isLogoutPending}
              onClick={() => void controller.logout()}
            />
          ) : null}

          {authState.mode === 'guest' ? (
            <>
              <LinkButton href={ROUTES.LOGIN} variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href={ROUTES.REGISTER} size="sm">
                Register
              </LinkButton>
            </>
          ) : null}
        </div>

        {controller.isClientMode ? (
          <LinkButton
            className={css.mobileCartLink}
            href={ROUTES.CART}
            variant="ghost"
            size="sm"
            aria-label={`Cart with ${cartCountLabel}`}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span className={css.cartCount}>{visibleCartItemsCount}</span>
          </LinkButton>
        ) : null}

        <BurgerButton
          controlsId={mobileNavigationId}
          isOpen={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        />
      </Container>

      <MobileOffcanvas
        id={mobileNavigationId}
        isOpen={isMobileMenuOpen}
        pathname={pathname}
        controller={controller}
        onClose={handleCloseMobileMenu}
      />
    </header>
  );
}

export default Header;
