'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import clsx from 'clsx';

import css from './HomeReviewsSlider.module.css';

//===================================================================

type Review = {
  name: string;
  rating: number;
  text: string;
};

type HomeReviewsSliderProps = {
  reviews: readonly Review[];
};

//===================================================================

function HomeReviewsSlider({ reviews }: HomeReviewsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPreviousSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? reviews.length - 1 : currentIndex - 1
    );
  };

  const goToNextSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === reviews.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <div className={css.slider} aria-roledescription="carousel">
      <div className={css.viewport}>
        <div
          className={css.track}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {reviews.map((review, index) => (
            <article
              className={css.slide}
              key={review.name}
              aria-hidden={index !== activeIndex}
            >
              <div className={css.reviewCard}>
                <div className={css.avatar} aria-hidden="true">
                  {review.name.charAt(0)}
                </div>
                <h3>{review.name}</h3>
                <div className={css.rating} aria-label={`${review.rating} out of 5`}>
                  <Star size={16} aria-hidden="true" />
                  <strong>{review.rating.toFixed(1)}</strong>
                  <span>/ 5</span>
                </div>
                <p>{review.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={css.controls}>
        <button
          className={css.arrow}
          type="button"
          onClick={goToPreviousSlide}
          aria-label="Show previous review"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        <div className={css.pagination} aria-label="Reviews pagination">
          {reviews.map((review, index) => (
            <button
              className={clsx(css.dot, index === activeIndex && css.dotActive)}
              type="button"
              key={review.name}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show review ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          className={css.arrow}
          type="button"
          onClick={goToNextSlide}
          aria-label="Show next review"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default HomeReviewsSlider;
