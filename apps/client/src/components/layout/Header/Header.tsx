'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ButtonLink, Container, Logo } from '@/components/common';

import { CLIENT_NAV_LINKS } from '@/lib/constants/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { isActiveRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

import css from './Header.module.css';

function Header() {
  const pathname = usePathname();

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
          <ButtonLink href={ROUTES.LOGIN} variant="ghost" size="sm">
            Log in
          </ButtonLink>

          <ButtonLink href={ROUTES.REGISTER} size="sm">
            Register
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}

export default Header;
