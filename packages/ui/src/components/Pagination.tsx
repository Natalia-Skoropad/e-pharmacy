import type { ReactNode } from 'react';

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
    <nav className={className} aria-label={ariaLabel}>
      <ul className={listClassName}>
        {items.map((item) => (
          <li key={item.page} className={itemClassName}>
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
