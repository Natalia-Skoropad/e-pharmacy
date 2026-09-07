import clsx from 'clsx';

import css from './CatalogCardSkeleton.module.css';

//===================================================================

export type CatalogCardSkeletonProps = Readonly<{
  count?: number;
  label?: string;
  className?: string;
}>;

//===================================================================

function SkeletonCard() {
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
          <span className={clsx(css.block, css.summaryLine)} />
          <span className={clsx(css.block, css.summaryLine)} />
          <span className={clsx(css.block, css.summaryLineShort)} />
        </div>

        <div className={css.footer}>
          <span className={clsx(css.block, css.footerValue)} />
          <span className={clsx(css.block, css.footerAction)} />
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
}: CatalogCardSkeletonProps) {
  return (
    <div className={clsx(css.wrapper, className)} role="status" aria-label={label}>
      <span className="visually-hidden">{label}</span>
      <div className={css.grid} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
