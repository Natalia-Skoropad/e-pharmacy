import clsx from 'clsx';

import { Container } from '@e-pharmacy/ui/layout';

import CatalogCardSkeleton, {
  type CatalogCardSkeletonVariant,
} from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

import css from './CatalogPageLoading.module.css';

//===================================================================

export type CatalogPageLoadingProps = Readonly<{
  label: string;
  variant: CatalogCardSkeletonVariant;
}>;

//===================================================================

function FilterFieldSkeleton() {
  return (
    <div className={css.filterField} aria-hidden="true">
      <span className={clsx(css.block, css.filterLabel)} />
      <span className={clsx(css.block, css.filterControl)} />
    </div>
  );
}

//===================================================================

export default function CatalogPageLoading({
  label,
  variant,
}: CatalogPageLoadingProps) {
  const filterCount = variant === 'product' ? 5 : 3;

  return (
    <main className={css.page} aria-busy="true">
      <section className={css.section}>
        <Container>
          <div className={css.breadcrumbs} aria-hidden="true">
            <span className={clsx(css.block, css.breadcrumbHome)} />
            <span className={clsx(css.block, css.breadcrumbCurrent)} />
          </div>

          <div className={clsx(css.block, css.title)} aria-hidden="true" />

          <div className={css.searchCard} aria-hidden="true">
            <div
              className={clsx(
                css.filters,
                variant === 'product' ? css.filtersWide : css.filtersCompact
              )}
            >
              {Array.from({ length: filterCount }, (_, index) => (
                <FilterFieldSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className={css.toolbar} aria-hidden="true">
            <span className={clsx(css.block, css.countLabel)} />
            <div className={css.sortField}>
              <span className={clsx(css.block, css.sortLabel)} />
              <span className={clsx(css.block, css.sortControl)} />
            </div>
          </div>

          <CatalogCardSkeleton count={6} label={label} variant={variant} />
        </Container>
      </section>
    </main>
  );
}
