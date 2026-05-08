import { Star } from 'lucide-react';

import type { ProductReview } from '@/types';

import css from './ProductReviewsList.module.css';

//===================================================================

type ProductReviewsListProps = {
  reviews: ProductReview[];
};

//===================================================================

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

//===================================================================

function ProductReviewsList({ reviews }: ProductReviewsListProps) {
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
    <ul className={css.list}>
      {reviews.map((review) => (
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
                <Star className={css.star} name="icon-star" size={16} />
                {review.rating}
              </span>
            </div>

            <p className={css.comment}>{review.comment}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}

export default ProductReviewsList;
