import Link from 'next/link';
import clsx from 'clsx';
import { Home } from 'lucide-react';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

import css from './Breadcrumbs.module.css';

//===================================================================

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

//===================================================================

function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items?.length) return null;

  return (
    <nav className={clsx(css.nav, className)} aria-label="Breadcrumbs">
      <ul className={css.list}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isLink = Boolean(item.href) && !isLast;

          return (
            <li key={`${item.label}-${idx}`} className={css.item}>
              {idx === 0 && item.href && !isLast ? (
                <Link href={item.href} className={css.link}>
                  <Home size={16} className={css.homeIcon} aria-hidden="true" />
                  <span className={css.linkText}>{item.label}</span>
                </Link>
              ) : isLink ? (
                <Link href={item.href!} className={css.link}>
                  <span className={css.linkText}>{item.label}</span>
                </Link>
              ) : (
                <span className={css.current} aria-current="page">
                  {item.label}
                </span>
              )}

              {!isLast ? (
                <span className={css.sep} aria-hidden="true">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Breadcrumbs;
