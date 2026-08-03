import clsx from 'clsx';
import type { ReactNode } from 'react';

import css from './CatalogFiltersShell.module.css';

//===================================================================

export type CatalogFiltersShellProps = Readonly<{
  headingId: string;
  heading: string;
  layout: 'compact' | 'wide';
  searchFields: ReactNode;
  desktopFilterFields: ReactNode;
  resetAction: ReactNode;
  countLabel: ReactNode;
  filterButton: ReactNode;
  desktopSort: ReactNode;
  drawer: ReactNode;
  isPending: boolean;
}>;

//===================================================================

function CatalogFiltersShell({
  headingId,
  heading,
  layout,
  searchFields,
  desktopFilterFields,
  resetAction,
  countLabel,
  filterButton,
  desktopSort,
  drawer,
  isPending,
}: CatalogFiltersShellProps) {
  return (
    <section
      className={css.region}
      aria-labelledby={headingId}
      aria-busy={isPending || undefined}
    >
      <h2 className="visually-hidden" id={headingId}>
        {heading}
      </h2>

      <div className={css.searchCard}>
        <div
          className={clsx(
            css.searchGrid,
            layout === 'wide' ? css.searchGridWide : css.searchGridCompact
          )}
        >
          {searchFields}
          <div className={css.desktopFilters}>{desktopFilterFields}</div>
          <div className={css.desktopResetSlot}>{resetAction}</div>
        </div>
      </div>

      <div className={css.catalogToolbar}>
        {countLabel}
        <div className={css.filterButton}>{filterButton}</div>
        <div className={css.desktopSort}>{desktopSort}</div>
      </div>

      {isPending ? (
        <p className="visually-hidden" role="status" aria-live="polite">
          Updating catalog results.
        </p>
      ) : null}

      {drawer}
    </section>
  );
}

export default CatalogFiltersShell;
