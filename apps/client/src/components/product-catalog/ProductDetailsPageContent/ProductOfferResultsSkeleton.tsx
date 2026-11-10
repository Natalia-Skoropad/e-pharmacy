import css from './ProductOfferResultsSkeleton.module.css';

//===================================================================

export type ProductOfferResultsSkeletonProps = Readonly<{
  count?: number;
}>;

//===================================================================

export function ProductOfferResultsSkeleton({
  count = 3,
}: ProductOfferResultsSkeletonProps) {
  return (
    <div
      className={css.region}
      role="status"
      aria-live="polite"
      aria-label="Updating pharmacy offers"
    >
      <ul className={css.list} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li className={css.card} key={index}>
            <div className={css.main}>
              <div className={`${css.shimmer} ${css.location}`} />
              <div className={`${css.shimmer} ${css.title}`} />
              <div className={`${css.shimmer} ${css.rating}`} />
              <div className={css.contactRows}>
                {Array.from({ length: 3 }, (_row, rowIndex) => (
                  <div className={css.contactRow} key={rowIndex}>
                    <span className={`${css.shimmer} ${css.contactLabel}`} />
                    <span className={`${css.shimmer} ${css.contactValue}`} />
                  </div>
                ))}
              </div>
              <div className={`${css.shimmer} ${css.image}`} />
            </div>
            <div className={css.aside}>
              <div className={`${css.shimmer} ${css.price}`} />
              <div className={`${css.shimmer} ${css.counter}`} />
              <div className={`${css.shimmer} ${css.total}`} />
              <div className={`${css.shimmer} ${css.note}`} />
              <div className={`${css.shimmer} ${css.button}`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
