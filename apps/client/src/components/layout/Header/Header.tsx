'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import clsx from 'clsx';

import {
  ButtonLink,
  Logo,
  LogoutButton,
  UserBadge,
} from '@e-pharmacy/ui/common';

import { Container, BurgerButton } from '@e-pharmacy/ui/layout';

import { ROUTES, isActiveRoute } from '@/lib/routes';
import { getPharmacyDashboardUrl } from '@/lib/auth';
import { useCart } from '@/providers/CartProvider';

import { usePublicAuthActionsState } from '@/components/layout/hooks/usePublicAuthActionsState';
import { CLIENT_NAV_LINKS } from '@/components/layout/config/navigation';
import MobileOffcanvas from '@/components/layout/MobileOffcanvas';

import css from './Header.module.css';

//===================================================================

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const mobileNavigationId = useId();

  const {
    user,
    logout,
    isAuthReady,
    shouldShowGuestActions,
    shouldShowClientActions,
    shouldShowPharmacyActions,
    shouldShowAuthenticatedActions,
  } = usePublicAuthActionsState();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const { cart } = useCart();
  const visibleCartItemsCount = shouldShowClientActions ? cart.totalItems : 0;

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      router.replace(ROUTES.HOME);
    } finally {
      setIsLogoutLoading(false);
    }
  };

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
          {shouldShowClientActions ? (
            <ButtonLink
              className={css.cartLink}
              href={ROUTES.CART}
              variant="ghost"
              size="sm"
              aria-label={`Cart with ${visibleCartItemsCount} items`}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span className={css.cartText}>Cart</span>
              <span className={css.cartCount}>{visibleCartItemsCount}</span>
            </ButtonLink>
          ) : null}

          {!isAuthReady ? (
            <div className={css.authSkeleton} aria-hidden="true" />
          ) : null}

          {shouldShowClientActions ? (
            <UserBadge
              className={css.profileLink}
              href={ROUTES.PROFILE}
              name={user?.name}
              pictureUrl={user?.pictureUrl}
            />
          ) : null}

          {shouldShowPharmacyActions ? (
            <ButtonLink
              className={css.pharmacyCabinetLink}
              href={getPharmacyDashboardUrl()}
              variant="secondary"
              size="sm"
            >
              Pharmacy cabinet
            </ButtonLink>
          ) : null}

          {shouldShowAuthenticatedActions ? (
            <LogoutButton
              isLoading={isLogoutLoading}
              disabled={isLogoutLoading}
              onClick={handleLogout}
            />
          ) : null}

          {shouldShowGuestActions ? (
            <>
              <ButtonLink href={ROUTES.LOGIN} variant="ghost" size="sm">
                Log in
              </ButtonLink>

              <ButtonLink href={ROUTES.REGISTER} size="sm">
                Register
              </ButtonLink>
            </>
          ) : null}
        </div>

        {shouldShowClientActions ? (
          <ButtonLink
            className={css.mobileCartLink}
            href={ROUTES.CART}
            variant="ghost"
            size="sm"
            aria-label={`Cart with ${visibleCartItemsCount} items`}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span className={css.cartCount}>{visibleCartItemsCount}</span>
          </ButtonLink>
        ) : null}

        <BurgerButton
          controlsId={mobileNavigationId}
          isOpen={isMobileMenuOpen}
          onClick={handleToggleMobileMenu}
        />
      </Container>

      <MobileOffcanvas
        id={mobileNavigationId}
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
      />
    </header>
  );
}

export default Header;
