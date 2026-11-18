import css from './OrderPageSkeleton.module.css';

//===================================================================

type OrderPageSkeletonProps = Readonly<{ variant: 'cart' | 'checkout' }>;

//===================================================================

/** Content-shaped placeholders; no separate spinner to prevent layout jumps. */
export function OrderPageSkeleton({ variant }: OrderPageSkeletonProps) {
  return (
    <div
      className={css.grid}
      aria-busy="true"
      role="status"
      aria-label="Loading pharmacy orders"
    >
      <span className="visually-hidden">Loading pharmacy orders...</span>
      <div className={css.main}>
        {Array.from({ length: variant === 'cart' ? 2 : 3 }, (_, index) => (
          <div className={css.card} key={index} aria-hidden="true">
            <div className={css.row}>
              <span className={`${css.shimmer} ${css.avatar}`} />
              <div className={css.lines}>
                <span className={`${css.shimmer} ${css.lineShort}`} />
                <span className={`${css.shimmer} ${css.line}`} />
              </div>
            </div>
            <div className={css.row}>
              <span className={`${css.shimmer} ${css.photo}`} />
              <div className={css.lines}>
                <span className={`${css.shimmer} ${css.line}`} />
                <span className={`${css.shimmer} ${css.lineMedium}`} />
                <span className={`${css.shimmer} ${css.lineShort}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={css.summary} aria-hidden="true">
        <span className={`${css.shimmer} ${css.lineMedium}`} />
        <span className={`${css.shimmer} ${css.line}`} />
        <span className={`${css.shimmer} ${css.line}`} />
        <span className={`${css.shimmer} ${css.action}`} />
      </div>
    </div>
  );
}
