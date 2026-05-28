'use client';

import { useMemo, useState } from 'react';

import { useAuth } from '@/providers';
import { isReviewValid, REVIEW_MAX_LENGTH } from '@/lib/reviews';

//===================================================================

type ReviewPayload = {
  rating: number;
  comment: string;
};

type UseReviewFormParams = {
  createReview: (payload: ReviewPayload, token: string) => Promise<unknown>;
  showToast: (message: string) => void;
};

//===================================================================

export function useReviewForm({ createReview, showToast }: UseReviewFormParams) {
  const { token, isAuthenticated } = useAuth();

  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const isValid = useMemo(
    () => isReviewValid(reviewText, reviewRating),
    [reviewRating, reviewText]
  );

  const handleReviewTextChange = (value: string) => {
    if (value.length > REVIEW_MAX_LENGTH) return;

    setReviewText(value);
  };

  const handleReviewSubmit = async () => {
    if (!isValid || !isAuthenticated || !token) return;

    try {
      setIsReviewSubmitting(true);

      await createReview(
        {
          rating: reviewRating,
          comment: reviewText.trim(),
        },
        token
      );

      setReviewText('');
      setReviewRating(0);
      showToast('Review was accepted and will be visible after moderation.');
    } catch {
      showToast('Could not submit review.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return {
    reviewText,
    reviewRating,
    isReviewValid: isValid,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange: setReviewRating,
    handleReviewSubmit,
  };
}
