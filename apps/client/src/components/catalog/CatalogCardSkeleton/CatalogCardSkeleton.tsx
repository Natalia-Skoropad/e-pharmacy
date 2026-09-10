import clsx from 'clsx';

import css from './CatalogCardSkeleton.module.css';

//===================================================================

export type CatalogCardSkeletonVariant = 'product' | 'pharmacy';

//===================================================================

export type CatalogCardSkeletonProps = Readonly<{
  count?: number;
  label?: string;
  className?: string;
  variant?: CatalogCardSkeletonVariant;
}>;

//===================================================================

function SkeletonSummaryRow({ short = false }: Readonly<{ short?: boolean }>) {
  return (
    <div className={css.summaryRow}>
      <span className={clsx(css.block, css.summaryLabel)} />
      <span
        className={clsx(
          css.block,
          css.summaryValue,
          short && css.summaryValueShort
        )}
      />
    </div>
  );
}

//===================================================================

function SkeletonCard({
  variant,
}: Readonly<{ variant: CatalogCardSkeletonVariant }>) {
  const isPharmacy = variant === 'pharmacy';

  return (
    <article className={css.card} aria-hidden="true">
      <div className={clsx(css.block, css.image)} />

      <div className={css.content}>
        <div className={css.metaRow}>
          <span className={clsx(css.block, css.meta)} />
          <span className={clsx(css.block, css.rating)} />
        </div>

        <span className={clsx(css.block, css.title)} />
        <span className={clsx(css.block, css.titleShort)} />

        <div className={css.summary}>
          <SkeletonSummaryRow />
          <SkeletonSummaryRow short />
          {isPharmacy ? <SkeletonSummaryRow /> : null}
        </div>

        <div className={css.footer}>
          {isPharmacy ? (
            <>
              <span className={clsx(css.block, css.footerButton)} />
              <span className={clsx(css.block, css.footerButton)} />
            </>
          ) : (
            <>
              <span className={clsx(css.block, css.footerValue)} />
              <span className={clsx(css.block, css.footerButton)} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}

//===================================================================

export default function CatalogCardSkeleton({
  count = 6,
  label = 'Loading catalog items',
  className,
  variant = 'product',
}: CatalogCardSkeletonProps) {
  return (
    <div
      className={clsx(css.wrapper, className)}
      role="status"
      aria-label={label}
    >
      <span className="visually-hidden">{label}</span>
      <div className={css.grid} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} variant={variant} />
        ))}
      </div>
    </div>
  );
}
