import type { ReactNode } from 'react';

import styles from './Pagination.module.css';
import { joinClassNames } from './classNames';

//=============================================================================

export type PaginationItem = {
  page: number;
  href?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  label?: ReactNode;
};

export type PaginationProps = {
  items: PaginationItem[];
  ariaLabel?: string;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
};

//=============================================================================

export function Pagination({
  items,
  ariaLabel = 'Pagination',
  className,
  listClassName,
  itemClassName,
}: PaginationProps) {
  return (
    <nav className={joinClassNames(styles.nav, className)} aria-label={ariaLabel}>
      <ul className={joinClassNames(styles.list, listClassName)}>
        {items.map((item) => (
          <li key={item.page} className={joinClassNames(styles.item, itemClassName)}>
            {item.href && !item.isDisabled && !item.isCurrent ? (
              <a href={item.href}>{item.label ?? item.page}</a>
            ) : (
              <span aria-current={item.isCurrent ? 'page' : undefined}>
                {item.label ?? item.page}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
