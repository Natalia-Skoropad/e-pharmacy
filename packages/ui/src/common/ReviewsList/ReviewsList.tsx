'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import { formatReviewDate } from '@e-pharmacy/utils/formatters';

import CountLabel from '../CountLabel/CountLabel';
import LazyLoadButton from '../LazyLoadButton/LazyLoadButton';

import css from './ReviewsList.module.css';

//===================================================================

export type ReviewsListItem = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewsListProps = {
  reviews: ReviewsListItem[];
  title?: string;
  emptyTitle?: string;
  emptyText?: string;
  initialVisibleCount?: number;
  step?: number;
};

//===================================================================

const DEFAULT_VISIBLE_REVIEWS_COUNT = 10;
const REVIEWS_LOAD_DELAY_MS = 250;

//===================================================================

function ReviewsList({
  reviews,
  title = 'Reviews',
  emptyTitle = 'This pharmacy has no reviews yet.',
  emptyText = 'Client feedback will appear here after orders are completed.',
  initialVisibleCount = DEFAULT_VISIBLE_REVIEWS_COUNT,
  step = DEFAULT_VISIBLE_REVIEWS_COUNT,
}: ReviewsListProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const visibleReviews = reviews.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsLoadingMore(true);

    window.setTimeout(() => {
      setVisibleCount((current) => current + step);
      setIsLoadingMore(false);
    }, REVIEWS_LOAD_DELAY_MS);
  };

  return (
    <section className={css.section} aria-labelledby="reviews-list-title">
      <div className={css.headerBlock}>
        <h2 className={css.title} id="reviews-list-title">
          {title}
        </h2>

        <CountLabel
          shown={visibleReviews.length}
          total={reviews.length}
          label="reviews"
          className={css.count}
        />
      </div>

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
      )}
    </section>
  );
}

export default ReviewsList;
export { ReviewsList };
