import Link from 'next/link';
import { Home } from 'lucide-react';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

import css from './Breadcrumbs.module.css';

//===================================================================

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

//===================================================================

function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={css.breadcrumbs} aria-label="Breadcrumb">
      <ol className={css.list}>
        {items.map(({ label, href }, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const itemKey = `${label}-${href ?? 'current'}-${index}`;

          return (
            <li className={css.item} key={itemKey}>
              {href && !isLast ? (
                <Link className={css.link} href={href}>
                  {isFirst ? (
                    <Home
                      className={css.homeIcon}
                      size={16}
                      aria-hidden="true"
                    />
                  ) : null}

                  <span>{label}</span>
                </Link>
              ) : (
                <span className={css.current} aria-current="page">
                  {isFirst ? (
                    <Home
                      className={css.homeIcon}
                      size={16}
                      aria-hidden="true"
                    />
                  ) : null}

                  <span>{label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
