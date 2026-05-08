'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import { LazyLoadButton } from '@/components/common';

import type { ProductReview } from '@/types';

import css from './ProductReviewsList.module.css';

//===================================================================

type ProductReviewsListProps = {
  reviews: ProductReview[];
  initialVisibleCount?: number;
  step?: number;
};

//===================================================================

const DEFAULT_VISIBLE_REVIEWS_COUNT = 10;
const REVIEWS_LOAD_DELAY_MS = 250;

//===================================================================

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

//===================================================================

function ProductReviewsList({
  reviews,
  initialVisibleCount = DEFAULT_VISIBLE_REVIEWS_COUNT,
  step = DEFAULT_VISIBLE_REVIEWS_COUNT,
}: ProductReviewsListProps) {
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    initialVisibleCount
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleReviews = reviews.slice(0, visibleReviewsCount);

  const handleLoadMore = () => {
    setIsLoadingMore(true);

    window.setTimeout(() => {
      setVisibleReviewsCount((count) => count + step);
      setIsLoadingMore(false);
    }, REVIEWS_LOAD_DELAY_MS);
  };

  if (reviews.length === 0) {
    return (
      <div className={css.empty}>
        <h3 className={css.emptyTitle}>No reviews yet</h3>
        <p className={css.emptyText}>
          Product reviews will appear here after customers share their feedback.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className={css.list}>
        {visibleReviews.map((review) => (
          <li className={css.item} key={review.id}>
            <article className={css.card}>
              <div className={css.header}>
                <div>
                  <h3 className={css.author}>{review.userName}</h3>

                  <time className={css.date} dateTime={review.createdAt}>
                    {formatReviewDate(review.createdAt)}
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
        isLoading={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}

export default ProductReviewsList;
