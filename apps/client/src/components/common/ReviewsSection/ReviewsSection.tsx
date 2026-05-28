'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import Button from '@/components/common/Button';
import LazyLoadButton from '@/components/common/LazyLoadButton';
import { CommentInput } from '@/components/form-fields';

import { formatReviewDate } from '@/lib/formatters';

import css from './ReviewsSection.module.css';

//===================================================================

export type ReviewItem = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewsSectionProps = {
  reviews: ReviewItem[];
  reviewText: string;
  reviewRating: number;
  isReviewValid: boolean;
  isReviewSubmitting: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isUnavailable?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  textareaId: string;
  maxLength: number;
  onReviewTextChange: (value: string) => void;
  onReviewRatingChange: (value: number) => void;
  onReviewSubmit: () => void;
  initialVisibleCount?: number;
  step?: number;
};

//===================================================================

const DEFAULT_VISIBLE_REVIEWS_COUNT = 10;
const REVIEWS_LOAD_DELAY_MS = 250;

//===================================================================

function ReviewsSection({
  reviews,
  reviewText,
  reviewRating,
  isReviewValid,
  isReviewSubmitting,
  isAuthenticated,
  isAuthReady,
  isUnavailable = false,
  emptyTitle = 'No reviews yet',
  emptyText = 'Reviews will appear here after customers share their feedback.',
  textareaId,
  maxLength,
  onReviewTextChange,
  onReviewRatingChange,
  onReviewSubmit,
  initialVisibleCount = DEFAULT_VISIBLE_REVIEWS_COUNT,
  step = DEFAULT_VISIBLE_REVIEWS_COUNT,
}: ReviewsSectionProps) {
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

  return (
    <>
      <form
        className={css.reviewForm}
        onSubmit={(event) => {
          event.preventDefault();
          onReviewSubmit();
        }}
      >
        <CommentInput
          id={textareaId}
          name="review"
          label="Your review"
          value={reviewText}
          required
          maxLength={maxLength}
          placeholder="Write 10–500 characters using latin letters."
          onChange={(event) => onReviewTextChange(event.target.value)}
        />

        <fieldset className={css.ratingFieldset}>
          <legend className={css.reviewLabel}>Rating</legend>

          <div className={css.ratingButtons}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                className={
                  reviewRating >= rating ? css.starButtonActive : css.starButton
                }
                key={rating}
                type="button"
                onClick={() => onReviewRatingChange(rating)}
                aria-label={`Set rating ${rating}`}
              >
                <Star size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={css.reviewActions}>
          <Button
            type="submit"
            className={css.reviewSubmitButton}
            disabled={
              !isReviewValid ||
              isReviewSubmitting ||
              !isAuthenticated ||
              !isAuthReady
            }
          >
            {isReviewSubmitting ? 'Sending...' : 'Send review'}
          </Button>

          {!isAuthenticated && isAuthReady ? (
            <p className={css.authNote}>
              Only logged-in users can submit reviews.
            </p>
          ) : null}
        </div>
      </form>

      {isUnavailable ? (
        <div className={css.notice} role="status">
          Reviews are temporarily unavailable. Please check that the backend API
          is running.
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
      )}
    </>
  );
}

export default ReviewsSection;
