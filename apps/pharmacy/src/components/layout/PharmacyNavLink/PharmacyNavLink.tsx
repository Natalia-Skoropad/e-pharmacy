'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import type { PharmacyNavigationItem } from '@/lib/pharmacy/navigation';

import css from './PharmacyNavLink.module.css';

//===================================================================

type PharmacyNavLinkProps = Readonly<{
  item: PharmacyNavigationItem;
  onNavigate?: () => void;
}>;

//===================================================================

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

//===================================================================

export function PharmacyNavLink({ item, onNavigate }: PharmacyNavLinkProps) {
  const pathname = usePathname();
  const isActive = isActiveRoute(pathname, item.href);

  return (
    <Link
      className={clsx(css.link, isActive && css.active)}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}
