'use client';

import { Star } from 'lucide-react';

import css from './ReviewsSection.module.css';

//===================================================================

export type ReviewRatingInputProps = Readonly<{
  id: string;
  value: number;
  error?: string;
  isTouched: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
}>;

//===================================================================

export function ReviewRatingInput({
  id,
  value,
  error,
  isTouched,
  disabled,
  onChange,
}: ReviewRatingInputProps) {
  const errorId = `${id}-error`;
  const showError = Boolean(isTouched && error);

  return (
    <fieldset className={css.ratingFieldset}>
      <legend className={css.reviewLabel}>Rating</legend>

      <div
        className={css.ratingButtons}
        id={id}
        role="radiogroup"
        aria-label="Review rating"
        aria-required="true"
        aria-invalid={showError || undefined}
        aria-describedby={showError ? errorId : undefined}
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const isSelected = value === rating;
          const isFilled = value >= rating;

          return (
            <label
              className={isFilled ? css.starButtonActive : css.starButton}
              key={rating}
            >
              <input
                className="visually-hidden"
                type="radio"
                name={id}
                value={rating}
                checked={isSelected}
                required
                disabled={disabled}
                aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                onChange={() => onChange(rating)}
              />
              <Star size={20} aria-hidden="true" />
            </label>
          );
        })}
      </div>

      {showError ? (
        <p className={css.ratingError} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
