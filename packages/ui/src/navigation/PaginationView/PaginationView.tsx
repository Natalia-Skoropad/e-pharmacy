'use client';

import {
  getPaginationItems,
  normalizePaginationState,
} from '../internal/pagination-model';

import css from './Pagination.module.css';

//===================================================================

export type PaginationLabels = Readonly<{
  previous?: string;
  next?: string;
  page?: string;
}>;

export type PaginationViewProps = Readonly<{
  currentPage: number;
  totalPages: number;
  ariaLabel?: string;
  labels?: PaginationLabels;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}>;

//===================================================================

const DEFAULT_LABELS: Required<PaginationLabels> = {
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
};

//===================================================================

export function PaginationView({
  currentPage,
  totalPages,
  ariaLabel = 'Pagination',
  labels,
  disabled = false,
  onPageChange,
}: PaginationViewProps) {
  const state = normalizePaginationState(currentPage, totalPages);
  if (!state || state.totalPages <= 1) return null;

  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const items = getPaginationItems(state.currentPage, state.totalPages);

  const changePage = (page: number) => {
    if (!disabled && page !== state.currentPage) onPageChange(page);
  };

  return (
    <nav className={css.pagination} aria-label={ariaLabel}>
      <p className="visually-hidden" aria-live="polite">
        {mergedLabels.page} {state.currentPage} of {state.totalPages}
      </p>
      <ul className={css.list}>
        <li>
          <button
            className={state.currentPage > 1 ? css.link : css.linkDisabled}
            type="button"
            disabled={disabled || state.currentPage <= 1}
            aria-label={`${mergedLabels.previous}, ${mergedLabels.page.toLowerCase()} ${state.currentPage - 1}`}
            onClick={() => changePage(state.currentPage - 1)}
          >
            {mergedLabels.previous}
          </button>
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
              <button
                className={isCurrent ? css.current : css.link}
                type="button"
                disabled={disabled || isCurrent}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`${mergedLabels.page} ${item}`}
                onClick={() => changePage(item)}
              >
                {item}
              </button>
            </li>
          );
        })}

        <li>
          <button
            className={
              state.currentPage < state.totalPages ? css.link : css.linkDisabled
            }
            type="button"
            disabled={disabled || state.currentPage >= state.totalPages}
            aria-label={`${mergedLabels.next}, ${mergedLabels.page.toLowerCase()} ${state.currentPage + 1}`}
            onClick={() => changePage(state.currentPage + 1)}
          >
            {mergedLabels.next}
          </button>
        </li>
      </ul>
    </nav>
  );
}
