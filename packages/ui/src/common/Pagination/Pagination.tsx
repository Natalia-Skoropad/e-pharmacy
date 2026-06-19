import type { ReactNode } from 'react';
import Link from 'next/link';

import css from './Pagination.module.css';

//===================================================================

export type PaginationLabels = {
  previous?: string;
  next?: string;
  page?: string;
};

type PaginationLinkRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  'aria-label'?: string;
};

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  ariaLabel?: string;
  labels?: PaginationLabels;
  renderLink?: (props: PaginationLinkRenderProps) => ReactNode;
};

//===================================================================

const SIBLING_COUNT = 1;

const DEFAULT_LABELS: Required<PaginationLabels> = {
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
};

//===================================================================

function getPaginationItems(currentPage: number, totalPages: number) {
  const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 2);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages - 1);

  pages.push(1);

  if (leftSibling > 2) pages.push('ellipsis-left');

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    pages.push(page);
  }

  if (rightSibling < totalPages - 1) pages.push('ellipsis-right');

  pages.push(totalPages);

  return pages;
}

//===================================================================

function Pagination({
  currentPage,
  totalPages,
  getPageHref,
  ariaLabel = 'Pagination',
  labels,
  renderLink,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const items = getPaginationItems(currentPage, totalPages);

  const renderPaginationLink = ({
    href,
    className,
    children,
    'aria-label': linkAriaLabel,
  }: PaginationLinkRenderProps) => {
    if (renderLink) {
      return renderLink({
        href,
        className,
        children,
        'aria-label': linkAriaLabel,
      });
    }

    return (
      <Link className={className} href={href} aria-label={linkAriaLabel}>
        {children}
      </Link>
    );
  };

  return (
    <nav className={css.pagination} aria-label={ariaLabel}>
      <ul className={css.list}>
        <li>
          {currentPage > 1 ? (
            renderPaginationLink({
              href: getPageHref(previousPage),
              className: css.link,
              'aria-label': `${mergedLabels.previous}, ${mergedLabels.page.toLowerCase()} ${previousPage}`,
              children: mergedLabels.previous,
            })
          ) : (
            <span className={css.linkDisabled} aria-disabled="true">
              {mergedLabels.previous}
            </span>
          )}
        </li>

        {items.map((item) => {
          if (typeof item !== 'number') {
            return (
              <li key={item}>
                <span className={css.ellipsis} aria-hidden="true">
                  …
                </span>
              </li>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <li key={item}>
              {isCurrent ? (
                <span className={css.current} aria-current="page">
                  <span className="visually-hidden">{mergedLabels.page} </span>
                  {item}
                </span>
              ) : (
                renderPaginationLink({
                  href: getPageHref(item),
                  className: css.link,
                  'aria-label': `${mergedLabels.page} ${item}`,
                  children: (
                    <>
                      <span className="visually-hidden">{mergedLabels.page} </span>
                      {item}
                    </>
                  ),
                })
              )}
            </li>
          );
        })}

        <li>
          {currentPage < totalPages ? (
            renderPaginationLink({
              href: getPageHref(nextPage),
              className: css.link,
              'aria-label': `${mergedLabels.next}, ${mergedLabels.page.toLowerCase()} ${nextPage}`,
              children: mergedLabels.next,
            })
          ) : (
            <span className={css.linkDisabled} aria-disabled="true">
              {mergedLabels.next}
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;

export { Pagination };
