'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { Button, ButtonLink, Container, Logo, UserBadge } from '@/components/common';

import BurgerButton from '@/components/layout/BurgerButton';
import MobileOffcanvas from '@/components/layout/MobileOffcanvas';

import { CLIENT_NAV_LINKS } from '@/lib/constants/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { isActiveRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

import {
  CART_UPDATED_EVENT,
  type CartUpdatedEventDetail,
} from '@/lib/cart/cart-events';

import { useAuth } from '@/providers';
import { getCart } from '@/services';

import css from './Header.module.css';

//===================================================================

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const mobileNavigationId = useId();

  const { token, isAuthenticated, isAuthReady, user, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const visibleCartItemsCount = isAuthenticated && token ? cartItemsCount : 0;

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isMounted = true;

    getCart(token)
      .then((response) => {
        if (isMounted) setCartItemsCount(response.cart.totalItems);
      })
      .catch(() => {
        if (isMounted) setCartItemsCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token, pathname]);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;

      setCartItemsCount(detail?.totalItems ?? 0);
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

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
          {isAuthReady && isAuthenticated ? (
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

          {isAuthReady && isAuthenticated ? (
            <>
              <UserBadge
                className={css.profileLink}
                href={ROUTES.PROFILE}
                name={user?.name}
                avatarUrl={user?.avatarUrl}
              />

              <Button
                variant="secondary"
                size="sm"
                disabled={isLogoutLoading}
                onClick={handleLogout}
              >
                {isLogoutLoading ? 'Logging out...' : 'Log out'}
              </Button>
            </>
          ) : null}

          {isAuthReady && !isAuthenticated ? (
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

        {isAuthReady && isAuthenticated ? (
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
