'use client';

import { useId, useState } from 'react';
import { Star } from 'lucide-react';

import { formatShortDate } from '@e-pharmacy/utils/date';

import CountLabel from '../CountLabel/CountLabel';
import LazyLoadButton from '../../primitives/LazyLoadButton/LazyLoadButton';

import css from './ReviewsList.module.css';

//===================================================================

export type ReviewsListItem = Readonly<{
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}>;

export type ReviewsListProps = Readonly<{
  reviews: readonly ReviewsListItem[];
  title?: string | null;
  emptyTitle?: string;
  emptyText?: string;
  initialVisibleCount?: number;
  visibleCount?: number;
  step?: number;
  onVisibleCountChange?: (value: number) => void;
}>;

//===================================================================

const DEFAULT_VISIBLE_REVIEWS_COUNT = 10;

//===================================================================

function ReviewsList({
  reviews,
  title = 'Reviews',
  emptyTitle = 'This pharmacy has no reviews yet.',
  emptyText = 'Client feedback will appear here after orders are completed.',
  initialVisibleCount = DEFAULT_VISIBLE_REVIEWS_COUNT,
  visibleCount,
  step = DEFAULT_VISIBLE_REVIEWS_COUNT,
  onVisibleCountChange,
}: ReviewsListProps) {
  const titleId = useId();

  const [internalVisibleCount, setInternalVisibleCount] =
    useState(initialVisibleCount);

  const resolvedVisibleCount = visibleCount ?? internalVisibleCount;
  const visibleReviews = reviews.slice(0, resolvedVisibleCount);

  const handleLoadMore = () => {
    const nextVisibleCount = Math.min(
      reviews.length,
      resolvedVisibleCount + step
    );

    if (onVisibleCountChange) {
      onVisibleCountChange(nextVisibleCount);
      return;
    }

    setInternalVisibleCount(nextVisibleCount);
  };

  return (
    <section
      className={css.section}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? (
        <div className={css.headerBlock}>
          <h2 className={css.title} id={titleId}>
            {title}
          </h2>

          <CountLabel
            shown={visibleReviews.length}
            total={reviews.length}
            label="reviews"
            className={css.count}
          />
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <div className={css.empty}>
          <h3 className={css.emptyTitle}>{emptyTitle}</h3>
          <p className={css.emptyText}>{emptyText}</p>
        </div>
      ) : (
        <>
          <ul className={css.list}>
            {visibleReviews.map((review) => (
              <li className={css.item} key={review.id}>
                <article className={css.card}>
                  <div className={css.cardHeader}>
                    <div>
                      <h3 className={css.author}>{review.userName}</h3>

                      <time className={css.date} dateTime={review.createdAt}>
                        {formatShortDate(review.createdAt) ?? '—'}
                      </time>
                    </div>

                    <span className={css.rating}>
                      <Star className={css.star} size={16} aria-hidden="true" />
                      {review.rating}
                    </span>
                  </div>

                  <p className={css.comment}>{review.comment}</p>
                </article>
              </li>
            ))}
          </ul>

          <LazyLoadButton
            visibleCount={visibleReviews.length}
            totalCount={reviews.length}
            label="Show more reviews"
            onLoadMore={handleLoadMore}
          />
        </>
      )}
    </section>
  );
}

export default ReviewsList;
export { ReviewsList, DEFAULT_VISIBLE_REVIEWS_COUNT };
