import Link from 'next/link';

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
          const isLast = index === items.length - 1;

          return (
            <li className={css.item} key={`${label}-${index}`}>
              {href && !isLast ? (
                <Link className={css.link} href={href}>
                  {label}
                </Link>
              ) : (
                <span className={css.current} aria-current="page">
                  {label}
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
