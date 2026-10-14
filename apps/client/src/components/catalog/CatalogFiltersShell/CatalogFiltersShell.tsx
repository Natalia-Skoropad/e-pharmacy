import type { ReactNode } from 'react';

import clsx from 'clsx';

import CatalogCardSkeleton from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

import css from './CatalogFiltersShell.module.css';

//===================================================================

export type CatalogFiltersShellProps = Readonly<{
  headingId: string;
  heading: string;
  layout: 'compact' | 'wide' | 'pharmacy';
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
      className={clsx(css.region, layout === 'pharmacy' && css.pharmacyLayout)}
      aria-labelledby={headingId}
      aria-busy={isPending || undefined}
      data-pharmacy-pending={
        layout === 'pharmacy' && isPending ? 'true' : undefined
      }
    >
      <h2 className="visually-hidden" id={headingId}>
        {heading}
      </h2>

      <div className={css.searchCard}>
        <div
          className={clsx(
            css.searchGrid,
            layout === 'wide'
              ? css.searchGridWide
              : layout === 'pharmacy'
                ? css.searchGridPharmacy
                : css.searchGridCompact
          )}
        >
          {searchFields}
          <div className={css.desktopFilters}>{desktopFilterFields}</div>
          <div className={css.desktopResetSlot}>{resetAction}</div>
          <div className={css.mobileFilterSlot}>{filterButton}</div>
        </div>
      </div>

      <div className={css.catalogToolbar}>
        {countLabel}
        <div className={css.filterButton}>{filterButton}</div>
        <div className={css.desktopSort}>{desktopSort}</div>
      </div>

      {isPending ? (
        layout === 'pharmacy' ? (
          <CatalogCardSkeleton
            count={3}
            variant="pharmacy"
            label="Updating pharmacy results"
          />
        ) : (
          <p className={css.pendingStatus} role="status" aria-live="polite">
            <span className={css.pendingSpinner} aria-hidden="true" />
            Updating catalog results…
          </p>
        )
      ) : null}

      {drawer}
    </section>
  );
}

export default CatalogFiltersShell;
