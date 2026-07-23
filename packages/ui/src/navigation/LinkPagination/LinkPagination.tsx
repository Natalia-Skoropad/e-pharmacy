import Link from 'next/link';

import type { PaginationLabels } from '../PaginationView';

import {
  getPaginationItems,
  normalizePaginationState,
} from '../internal/pagination-model';

import css from './Pagination.module.css';

//===================================================================

export type LinkPaginationProps = Readonly<{
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  ariaLabel?: string;
  labels?: PaginationLabels;
}>;

//===================================================================

const DEFAULT_LABELS: Required<PaginationLabels> = {
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
};

//===================================================================

export function LinkPagination({
  currentPage,
  totalPages,
  getPageHref,
  ariaLabel = 'Pagination',
  labels,
}: LinkPaginationProps) {
  const state = normalizePaginationState(currentPage, totalPages);
  if (!state || state.totalPages <= 1) return null;

  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const items = getPaginationItems(state.currentPage, state.totalPages);

  return (
    <nav className={css.pagination} aria-label={ariaLabel}>
      <ul className={css.list}>
        <li>
          {state.currentPage > 1 ? (
            <Link
              className={css.link}
              href={getPageHref(state.currentPage - 1)}
              aria-label={`${mergedLabels.previous}, ${mergedLabels.page.toLowerCase()} ${state.currentPage - 1}`}
            >
              {mergedLabels.previous}
            </Link>
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

          const isCurrent = item === state.currentPage;
          return (
            <li key={item}>
              {isCurrent ? (
                <span className={css.current} aria-current="page">
                  <span className="visually-hidden">{mergedLabels.page} </span>
                  {item}
                </span>
              ) : (
                <Link
                  className={css.link}
                  href={getPageHref(item)}
                  aria-label={`${mergedLabels.page} ${item}`}
                >
                  {item}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {state.currentPage < state.totalPages ? (
            <Link
              className={css.link}
              href={getPageHref(state.currentPage + 1)}
              aria-label={`${mergedLabels.next}, ${mergedLabels.page.toLowerCase()} ${state.currentPage + 1}`}
            >
              {mergedLabels.next}
            </Link>
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
